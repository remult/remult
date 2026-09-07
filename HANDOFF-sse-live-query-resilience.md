# Handoff: SSE / live-query resilience

Pick this up in remult. App-level workaround already shipped in `c:\repos\food-basket-delivery` (assign-families only). Do **not** duplicate a generic “reload if no SSE” bus in apps — this is a remult bug.

## Symptom (production)

Assign-families: click assign (`AddBox`) returns 200, basket count drops, **family list does not update**. Some users, not all. Long sessions more than short ones.

Live query is the only client update path for server-side assigns. SSE dies; keep-alive HTTP still looks healthy.

App: `food-basket-delivery` (`salmaz` / Heroku `web.1`, JWT in `Authorization`, EventSource cannot send it — GET `/stream` is anonymous, POST `/subscribe` has JWT). Remult `^3.3.17`.

## What we measured (SolarWinds, 2026-09-03 + 2026-09-06)

- Single dyno — **not** sticky-session / multi-process fan-out.
- `GET /{org}/api/stream`: 12,543 — **100%** end as Heroku **H27** (client interrupt). Normal for SSE close, but reconnect volume is high.
- `POST /stream/subscribe` bytes=29: **2,402 (5.4%)** → `"client connection not found"`.
- `POST /stream/subscribe` 403: 15 (channel ACL) — ignore.
- Median stream lifetime ~30s; ~61% die before the **45s** server SSE ping.
- Dyno **R14** the whole window (RSS 101–135% of 512MB). Event-loop stall → SSE ping late → Heroku idle **H15** (55s).
- Papertrail **filters** hide exactly the two signals we need:
  - `path="\/.*\/api\/_liveQueryKeepAlive.*"`
  - `error code=H15 .*/stream"`
  So “0 keep-alives / 0 H15” in the export is **not** evidence they didn’t happen.

Reproduce locally: DevTools → Request blocking `*/api/stream*` → hard reload. REST still works. Live query updates stop.

## The hole: check-active does not check the socket

Two independent sockets:

| Path | Role |
|---|---|
| `GET …/api/stream` | EventSource. Pushes live-query diffs. |
| `POST …/api/_liveQueryKeepAlive` | Body = query id array. Touches `lastUsed`. Returns unknown ids. |

Keep-alive never asks “is `connectionId` still in `SseSubscriptionServer.connections`?”

Zombie:

1. H15/H27/R14 drops GET `/stream`. Server removes `clientConnection`.
2. Next keep-alive POST still 200s — query ids exist, `lastUsed` refreshed.
3. Client `invalidIds = []` → **does not** `subscribeCode()`.
4. `itemChanged` publishes to a channel nobody is listening on.
5. After **4** EventSource errors, client **stops reconnecting** (`retryCount` never resets). Keep-alive keeps ticking.

`InMemoryLiveQueryStorage.forEach` also expires queries with `lastUsed` > 5 min. If keep-alive *is* running, this is secondary. food-basket `server.ts` calls `forEach('', …)` every 60s for memory stats — that **is** the reaper.

## Code to change

### 1. `projects/core/src/live-query/SseSubscriptionClient.ts`

- `onerror`: `source.close()`, retry `retryCount++ < flags.error500RetryCount` (**4**), **never reset** on `connectionId`.
- `openConnection()` Promise **never rejects**. After 4 errors, hangs forever.
- Native EventSource would retry forever; we fight it by closing.

**Fix:** infinite retry (backoff). Reset `retryCount` on `connectionId`. Reject (or error listeners) after first-connect timeout (~2s) so `liveQuery.subscribe` does not hang. Optionally stop `close()` on the first error and let the browser reconnect — still must handle **new** `connectionId` + `onReconnect`.

### 2. `projects/core/src/live-query/LiveQueryClient.ts`

`subscribeCode`: **`subscribeChannel` (SSE) then REST `liveQuery-{id}` snapshot.** If EventSource never gets `connectionId`, first `next()` never fires. Apps that `await` first emission show empty lists.

**Fix:** REST snapshot must not wait on SSE. Order: register query via HTTP, emit `setAllItems`, *then* attach channel (or attach in parallel, snapshot unblocked).

Keep-alive (30s) POSTs ids only. **Fix:** body `{ queryIds, connectionId }`. Server returns unknown query ids **or** `connectionAlive: false` → client `openConnection` + `subscribeCode` for all queries.

Keep backward compat: if body is `string[]`, old behavior.

### 3. `projects/core/SseSubscriptionServer.ts`

- Ping every **45s** (`sendLiveMessage`). Heroku idle **55s**; proxies often **30s**. Under GC/R14, 45s loses.
- `write()` calls `res.flush()` — good for `compression()` gzip.

**Fix:** ping **15–20s**. Consider skipping compression for `text/event-stream` in express adapter (app can also `compression.filter`).

`subscribeToChannel`: unknown `clientId` → `ConnectionNotFoundError` (string success, not HTTP error). Client reconnects; races with H27 are the 5.4%.

### 4. `projects/core/src/live-query/SubscriptionServer.ts`

`keepAliveAndReturnUnknownQueryIds(ids)` — query storage only.

**Fix:** accept optional `connectionId`. If that id is not in `connections`, treat **all** ids as unknown (or return `{ unknownQueryIds, connectionAlive: false }`). Needs `SseSubscriptionServer` to expose `hasConnection(id)`. Other `SubscriptionServer` impls (Ably etc.): `connectionAlive: true` / ignore.

### 5. `LiveQueryPublisher.runPromise` is `() => {}`

`itemChanged` fire-and-forgets the `forEach`. Intentional (changelog: async subscribers) but under memory pressure, unhandled / starved. Not the main bug; worth not swallowing errors.

## Suggested implementation order

1. Client: unbounded SSE retry + reset on `connectionId` + timeout/reject on first connect.
2. Client: REST live-query snapshot **without** waiting for EventSource.
3. Keep-alive: `connectionId` round-trip; dead socket → resubscribe.
4. Server ping 15–20s.
5. Tests in `projects/tests/tests/live-query-tests.spec.ts` (+ backend SSE tests if any under `projects/tests/backend-tests`).

Tests to add:

- EventSource `onerror` × 5 still reconnects.
- `connectionId` keep-alive with missing server connection → `subscribeCode` rerun.
- `liveQuery.subscribe` emits items if EventSource never opens (mock subscription client hang).
- `ConnectionNotFoundError` on `/subscribe` opens a new EventSource and retries channel subscribe.

## App workaround (already in food-basket-delivery)

Do not rip this out until remult is released and bumped.

- `src/app/my-families/user-families.ts`
  - `reload()`: `find()` first, then `liveQuery` (do not await SSE).
  - `confirmAssignSettled(min)`: wait 1.5s for liveQuery; if `toDeliver` still short, `find()`. Coalesced. Does **not** block the assign button.
- `src/app/asign-family/asign-family.component.ts` — call that after `AddBox` / specific assign. `assignMultipleFamilies` still `refreshList()` (heavier; can switch later).

Screen distinction: client `f.save()` already has the row. Fallback is only for **server assigns the client does not have yet**.

## Out of scope / already ruled out

- Multi-dyno (only `web.1`).
- JWT on EventSource (stream GET is unauthenticated by design here).
- 403 channel ACL (`users:${userId}:queries:…` vs `statusChange`) — rare.
- Replacing SSE with websocket/Ably for this app — overkill if the four remult holes close.

## When done

Bump remult in food-basket-delivery, keep `confirmAssignSettled` one release as belt, then delete it if prod is clean.
