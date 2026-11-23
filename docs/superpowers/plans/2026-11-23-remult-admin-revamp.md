# Remult Admin Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild remult admin as a permission-aware, prod-ready SvelteKit SPA (Svelte 5, ui-sdk, xyflow), with drawer editing, URL-shareable filters and a server `entities` hook, shipped as one PR.

**Architecture:** `projects/remult-admin` becomes a SvelteKit app (adapter-static, hash router, inline bundle) whose single HTML is baked into core by the existing `src/misc/build.ts`. Core's `buildEntityInfo` gains per-entity permissions + admin config, and a `__row-permissions` route gives exact per-row update/delete rights. Pure logic (URL state, filters, row drafts, http) lives in small tested TS modules; Svelte components stay thin.

**Tech Stack:** SvelteKit 3.4, Svelte 5.59 (runes), Vite 8, @sveltejs/adapter-static 4, @ui-sdk/svelte + @ui-sdk/core (0.1.0 beta, latest), @xyflow/svelte 2, CodeMirror 6, vitest, Playwright. npm.

**Spec:** `docs/superpowers/specs/2026-11-23-remult-admin-revamp-design.md` (read it first; this plan argues from it).

## Global Constraints

- One PR for everything (core + admin + docs + CHANGELOG).
- Output: one self-contained HTML, written by `projects/remult-admin/src/misc/build.ts` into `projects/core/server/get-remult-admin-html.ts`. Placeholders `<!--PLACE_HERE_HEAD-->` and `<!--PLACE_HERE_BODY-->` must survive (`projects/core/server/remult-admin-html.ts` injects `window.optionsFromServer = { rootPath, requireAuthToken, disableLiveQuery }`).
- Admin served at `<rootPath>/admin`, `<rootPath>/admin/`, `<rootPath>/admin/:id`; base path unknown at build time -> hash routing only.
- Size budget: today's `get-remult-admin-html.ts` is 812,243 bytes. Target <= that; stop and report before exceeding ~1MB.
- Package manager: npm (existing `package-lock.json` files).
- Svelte 5 runes only, no stores-as-API, no `svelte/legacy`.
- Styling: plain CSS + custom properties, no Tailwind. Light + dark.
- Code comments: WHY only. Regex literals at module scope. No em dashes in any copy.
- Hidden entities (server hook `false`) = top level only: absent from nav, Cmd+K, ERD; still reachable through relations.
- Permissions are UI only; server `allowApi*` stays the guard.
- CHANGELOG: add entries under `## [3.5.0] - [unreleased]` in root `CHANGELOG.md` (repo uses CHANGELOG, not changesets).

## Review Focus

- Entity with zero rows, or all rows filtered out: table shows an empty state, filter chips still editable, "+" still available if insert allowed. Pinned in Task 11.
- Malformed / stale URL (unknown field, bad operator, non-numeric `_page`, field the user can no longer see): ignored silently, page loads with remaining valid state. Pinned in Task 8.
- Live-query update arriving while a row has unsaved local edits: edits kept, row stays dirty, other rows re-baseline (no green). Pinned in Task 9.
- Token missing/expired (`requireAuthToken`, 401/403 mid-session): settings dialog prompts, entity marked Forbidden, no crash loop. Pinned in Tasks 7 (http) and 10 (prompt).
- Nullable vs non-nullable fields in filters and editors (`null` vs `undefined` vs `''`): "is empty" only on nullable, clearing a nullable sets `null`, untouched `undefined` never marks dirty. Pinned in Tasks 8 and 9.

---

## File structure

Core (modify):
- `projects/core/src/remult3/RepositoryImplementation.ts` - `apiInsertAllowed` fix.
- `projects/core/server/remult-admin.ts` - permissions, admin config, row permissions.
- `projects/core/server/remult-api-server.ts` - `entities` hook option, `__row-permissions` route.
- `projects/tests/tests/test-remult-admin.spec.ts` - core tests.
- `docs/docs/admin-ui.md`, `CHANGELOG.md`.

Admin (replace contents of `projects/remult-admin`, keep `db/`, `src/server/` demo, `src/misc/`):
- `svelte.config.js`, `vite.config.ts`, `package.json`, `src/app.html`, `playwright.config.ts`
- `src/lib/core/` - `god.svelte.ts` (entity infos + client repos), `http.ts` (headers, dedupe, forbidden), `settings.svelte.ts` (LS/SS persisted state)
- `src/lib/query/` - `url-state.ts` (URL <-> state), `filter-model.ts` (chips <-> EntityFilter, operators)
- `src/lib/table/` - `row-draft.svelte.ts`, `Table.svelte`, `Row.svelte`, `Cell.svelte`, `FilterBar.svelte`, `FilterChip.svelte`, `RowDrawer.svelte`, `RelationTabs.svelte`
- `src/lib/fields/` - one editor per type (`TextField`, `NumberField`, `BooleanField`, `EnumField`, `DateField`, `ColorField`, `JsonField`, `RelationField`), `FieldEditor.svelte` dispatcher
- `src/lib/shell/` - `Nav.svelte`, `CommandPalette.svelte`, `SettingsDialog.svelte`, `Toasts.svelte`, `theme.css`
- `src/lib/schema/` - `layout.ts`, `EntityNode.svelte`
- `src/routes/+layout.svelte`, `+layout.ts` (`ssr = false`, `prerender = false`), `+page.svelte`, `entity/[key]/+page.svelte`, `schema/+page.svelte`
- `tests/e2e/*.spec.ts` (Playwright), unit tests next to modules as `*.spec.ts`.

---

### Task 1: Spike - Kit hash + inline + size (throwaway)

**Files:** scratch only, e.g. `projects/remult-admin-spike/` (deleted at end, never committed).

- [ ] **Step 1:** `npx sv create` a minimal Kit app (TS, no addons), add adapter-static `{ fallback: 'index.html' }`, `kit.router.type = 'hash'`, `kit.output.bundleStrategy = 'inline'`, `src/routes/+layout.ts` with `export const ssr = false`.
- [ ] **Step 2:** Two routes: `/` and `/entity/[key]`; on the entity page read and write a `?status.in=...` query inside the hash via `page.url` + `goto(..., { replaceState: true, keepFocus: true, noScroll: true })`.
- [ ] **Step 3:** Add one ui-sdk Drawer, one `DatePicker mode="range"`, one `@xyflow/svelte` 2 canvas, CodeMirror json. Build.
- [ ] **Step 4: Verify.** Expected all true:
  - build output is one HTML with no external `.js`/`.css` refs (`grep -c '<script src' build/index.html` -> 0);
  - placeholders `<!--PLACE_HERE_HEAD-->` / `<!--PLACE_HERE_BODY-->` in `src/app.html` survive into output;
  - served as a string at `/api/admin` via a 10-line express route, hash routes navigate, query survives reload and back/forward;
  - output size recorded. If > 1MB, list the top 5 contributors (`rollup-plugin-visualizer`) and stop.
- [ ] **Step 5:** Report go/no-go + size + any Kit 3 deviations (option names) at the top of this plan as a "Spike result" note. Delete the spike folder.

### Task 2: Repro the green-rows bug on the current admin

**Files:** none changed (diagnosis only). Append findings to spec section "Green-rows bug".

- [ ] **Step 1:** `cd projects/remult-admin && npm ci && npm run dev`, open `http://localhost:5173/`, open several entities (Task, Contact, Deal), toggle live query on/off, edit a row in a second tab.
- [ ] **Step 2:** Confirm or rule out each suspect from the spec (stale `rowFrozzen` on live-query replace; Svelte 4 `<select bind:value>` writing first option on `undefined`; any other found). Record: entity, field, trigger, cause.
- [ ] **Step 3:** Commit the spec update: `git commit -m "docs: green rows root cause"`.

The cause found here becomes a named test in Task 8.

### Task 3: Core - fix `apiInsertAllowed`

**Files:**
- Modify: `projects/core/src/remult3/RepositoryImplementation.ts` (`apiInsertAllowed(item)` checks `allowApiUpdate === undefined`, should check `allowApiInsert`)
- Test: `projects/tests/tests/test-remult-admin.spec.ts` (or the closest existing metadata spec)

- [ ] **Step 1: Failing test** `metadata.apiInsertAllowed() follows allowApiInsert`: entity `@Entity('ins', { allowApiInsert: true })` -> `repo.metadata.apiInsertAllowed()` is `true`; `{ allowApiInsert: false, allowApiUpdate: true }` -> `false`.
- [ ] **Step 2:** Run `npx vitest run projects/tests/tests/test-remult-admin.spec.ts` -> FAIL (first case false).
- [ ] **Step 3:** Fix the condition.
- [ ] **Step 4:** Run the file + `npx vitest run` (full) -> PASS.
- [ ] **Step 5:** CHANGELOG `### Fixed`: `` `repo.metadata.apiInsertAllowed()` follows `allowApiInsert` (it checked `allowApiUpdate`). `` Commit `fix: apiInsertAllowed checks allowApiInsert`.

### Task 4: Core - entity permissions in `buildEntityInfo`

**Files:**
- Modify: `projects/core/server/remult-admin.ts`
- Test: `projects/tests/tests/test-remult-admin.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type AdminPermission = boolean | 'row'
  export interface EntityUIInfo { /* existing */ permissions: { insert: AdminPermission; update: AdminPermission; delete: AdminPermission } }
  export function resolveAdminPermission(remult: Remult, rule: AllowedForInstance<any> | undefined, kind: 'insert' | 'update' | 'delete'): AdminPermission
  ```

Rules: `undefined` rule -> same default as core metadata (`false`). Non-function (boolean, string role, array without functions) -> `remult.isAllowedForInstance(undefined, rule)` as boolean. Function (or array containing one): update/delete -> `'row'`; insert -> call with `undefined` in try/catch, boolean result as is, throw -> `'row'`. Read the rules from `metadata.options.allowApiInsert/Update/Delete` (already expanded from `allowApiCrud` in the constructor).

- [ ] **Step 1: Failing tests** (one `it` each):
  - `allowApiCrud: true` -> `{ insert: true, update: true, delete: true }`
  - `allowApiCrud: 'admin'`, user without role -> all `false`; with role `admin` -> all `true`
  - `allowApiCrud: () => false` -> `{ insert: false, update: 'row', delete: 'row' }`
  - `allowApiUpdate: (t) => t.owner === remult.user?.id` (throws on undefined) -> update `'row'`; `allowApiInsert: (t) => t.x > 1` -> insert `'row'`
  - no rules -> all `false`
- [ ] **Step 2:** Run -> FAIL.
- [ ] **Step 3:** Implement `resolveAdminPermission`, populate `permissions` in `buildEntityInfo`. Update the existing snapshot/assertions in `should get entities`.
- [ ] **Step 4:** Run file -> PASS.
- [ ] **Step 5:** Commit `feat(admin): entity permissions in admin metadata`.

### Task 5: Core - `admin.entities` hook

**Files:**
- Modify: `projects/core/server/remult-api-server.ts` (option type + pass to `buildEntityInfo`), `projects/core/server/remult-admin.ts`
- Test: `projects/tests/tests/test-remult-admin.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type AdminEditMode = 'inline' | 'drawer'
  export interface AdminEntityConfig { editMode?: AdminEditMode; lockEditMode?: boolean }
  // in RemultServerOptions.admin object form:
  entities?: (entity: EntityMetadata, remult: Remult) => boolean | AdminEntityConfig
  // AdminEntitiesOptions gains: entityConfig?: (entity, remult) => boolean | AdminEntityConfig
  // EntityUIInfo gains: hidden: boolean; editMode: AdminEditMode; editModeLocked: boolean
  ```
- Hidden entities stay in the returned array (relations need them) with `hidden: true`.

- [ ] **Step 1: Failing tests:** no hook -> every entity `{ hidden: false, editMode: 'inline', editModeLocked: false }`; hook returning `false` for `users` -> `users.hidden === true` and still present; hook returning `{ editMode: 'drawer', lockEditMode: true }` -> those values; hook receives the request `remult` (role-based case).
- [ ] **Step 2:** Run -> FAIL. **Step 3:** Implement; JSDoc on the option with the spec's example. **Step 4:** Run -> PASS.
- [ ] **Step 5:** Commit `feat(admin): entities hook to hide and tune entities`.

### Task 6: Core - `__row-permissions` route

**Files:**
- Modify: `projects/core/server/remult-admin.ts`, `projects/core/server/remult-api-server.ts`
- Test: `projects/tests/tests/test-remult-admin.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export async function getRowPermissions(o: { remult: Remult; entities: ClassType<any>[]; superKey: string; ids: string[] }): Promise<Record<string, { update: boolean; delete: boolean }>>
  ```
  HTTP: `POST <rootPath>/admin/__row-permissions`, body `{ superKey: string, ids: string[] }` (ids = `idMetadata.getId(row)` stringified, max 200), response = that record. Same `allow` guard as the admin page; not-allowed -> 404 like the page. Unknown superKey -> 404. Ids not found are omitted.
- `superKey` resolution must match `buildEntityInfo`'s `_ext_` numbering.
- Rows loaded with the request `remult` through the repo (so `apiPrefilter` applies), evaluated with `repo.getEntityRef(row).apiUpdateAllowed` / `apiDeleteAllowed`.

- [ ] **Step 1: Failing tests** on `getRowPermissions` with in-memory data: rule `allowApiUpdate: (t) => t.owner === remult.user?.id`, user `u1`, rows owned by `u1`/`u2` -> `{ a: { update: true, ... }, b: { update: false, ... } }`; `allowApiCrud: 'admin'` without role -> all false; unknown id omitted; `_ext_1` superKey resolves to the extended class.
- [ ] **Step 2:** FAIL. **Step 3:** Implement function + route (`r.route(rootPath + '/admin/__row-permissions').post(...)`, registered before `/admin/:id`). **Step 4:** PASS.
- [ ] **Step 5:** Docs `docs/docs/admin-ui.md`: `entities` hook section (spec example), permission-aware UI paragraph. CHANGELOG `### Added`: `admin.entities` hook; permission-aware admin. Run `npm run build` at repo root (refreshes public API report), commit report changes. Commit `feat(admin): row permissions route + docs`.

### Task 7: Admin - scaffold Kit app + data layer

**Files:**
- Delete: `projects/remult-admin/src/{App.svelte,main.ts,God.ts,lib,routes,stores,reset.css,app.css}`, `index.html`, `tsconfig.lib.json`.
- Create/modify: `package.json`, `svelte.config.js`, `vite.config.ts` (keep `local-express` middleware loading `./src/server`, keep visualizer), `src/app.html` (with both placeholders), `src/routes/+layout.ts`, `src/lib/core/{god.svelte.ts,http.ts,settings.svelte.ts}`, `src/misc/build.ts` (read new output path).
- Test: `src/lib/core/http.spec.ts`, `src/lib/core/settings.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  // settings.svelte.ts - persisted, versioned key 'RemultAdmin_2026_11'
  export const settings: { search: string; displayCaption: boolean; numberOfRows: number; confirmDelete: boolean; diagramLayout: 'grid-bfs' | 'grid-dfs' | 'line'; keyForBearerAuth: string; disableLiveQuery: boolean | undefined; customHeaders: string; theme: 'system' | 'light' | 'dark'; editMode: Record<string, AdminEditMode>; schemaPositions: Record<string, { x: number; y: number }>; lastLocation: string }
  export const session: { bearerAuth: string; forbiddenEntities: string[] }
  export function resetSettings(): void
  // http.ts
  export function buildHeaders(o: { bearerAuth: string; keyForBearerAuth: string; customHeaders: string; readLocalStorage: (k: string) => string | null }, init?: HeadersInit): Record<string, string>
  export function createHttpClient(o: { getHeaders: () => Record<string, string>; onForbidden: (entityKey: string) => void; dedupeMs?: number /* 2000 */ }): typeof fetch
  // god.svelte.ts
  export type TableInfo = EntityUIInfo & { repo: Repository<any> }
  export const god: { tables: TableInfo[]; visibleTables: TableInfo[]; loaded: boolean; error?: string; reload(): Promise<void>; bySuperKey(k: string): TableInfo | undefined; byKey(k: string): TableInfo | undefined }
  ```
- Port from old `God.ts`: client entity classes (json/number/boolean/string fields), but `Entity(...)` options use `allowApiInsert/Update/Delete` from `permissions` (`'row'` -> `true`, server decides).
- Settings read/write wrapped in try/catch (storage may throw).

- [ ] **Step 1: Failing tests:** `buildHeaders` (bearer wins over key; key reads localStorage; custom headers `a: 1\nb: 2` parsed, blank lines ignored, values containing `:` kept whole); `createHttpClient` (two GETs same URL within 2s -> one fetch; POST never cached; 403 on `/api/tasks` calls `onForbidden('tasks')`; 401 too); settings (corrupt JSON in storage -> defaults; storage throwing -> defaults, no crash).
- [ ] **Step 2:** `npx vitest run` in `projects/remult-admin` -> FAIL.
- [ ] **Step 3:** Scaffold Kit per Task 1 findings, implement modules. Add scripts: `dev`, `build` (`vite build && tsx src/misc/build.ts`), `check` (`svelte-check`), `test` (`vitest run`), `e2e` (`playwright test`).
- [ ] **Step 4:** `npm run test` PASS, `npm run check` 0 errors, `npm run build` writes `get-remult-admin-html.ts`; root `npx vitest run projects/tests/tests/test-remult-admin.spec.ts` PASS (html still injects options).
- [ ] **Step 5:** Commit `feat(admin): sveltekit spa scaffold + data layer`.

### Task 8: Admin - URL state + filter model

**Files:**
- Create: `src/lib/query/filter-model.ts`, `src/lib/query/url-state.ts`
- Test: `src/lib/query/filter-model.spec.ts`, `src/lib/query/url-state.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type FilterOp = 'eq' | 'ne' | 'contains' | 'startsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'nin' | 'empty' | 'notEmpty'
  export interface FilterChip { field: string; op: FilterOp; value?: unknown; value2?: unknown }
  export interface TableQuery { filters: FilterChip[]; sort?: { field: string; dir: 'asc' | 'desc' }; page: number }
  export function operatorsFor(field: FieldUIInfo): FilterOp[]
  export function chipsToWhere(chips: FilterChip[], fields: FieldUIInfo[], now?: { tz: 'local' }): EntityFilter<any>
  export function parseQuery(params: URLSearchParams, fields: FieldUIInfo[]): TableQuery
  export function serializeQuery(q: TableQuery, fields: FieldUIInfo[]): URLSearchParams
  ```
- URL format (REST-like): `field=v` (eq), `field.ne`, `field.contains`, `field.startsWith`, `field.gt|gte|lt|lte`, `field.in=["a","b"]`, `field.nin=[...]`, `field.null=true|false` (empty / notEmpty), between = `field.gte` + `field.lte` pair. `_sort=field&_order=asc|desc`, `_page=2` (omitted when 1).
- Operators per type exactly as spec "Filters"; `empty`/`notEmpty` only when `allowNull`; enum / value list / relation -> `in`, `nin`; boolean -> `eq` (+ empty if nullable).
- Dates: URL holds calendar dates `YYYY-MM-DD`. For `inputType: 'date'` fields compare as-is. For timestamp fields `chipsToWhere` maps to local-day ISO instants: `gte d` -> start of d local; `lte d` -> end of d local (23:59:59.999); `eq d` -> `$gte` start + `$lte` end; `lt d` -> `$lt` start; `gt d` -> `$gt` end.

- [ ] **Step 1: Failing tests:**
  - round trip: `serializeQuery(parseQuery(p))` equals `p` for `status.in=["open","done"]&createdAt.gte=2026-11-01&createdAt.lte=2026-11-30&_sort=name&_order=desc&_page=3`
  - between chip `{ field: 'createdAt', op: 'between', value: '2026-11-01', value2: '2026-11-30' }` <-> `createdAt.gte` + `createdAt.lte`
  - `chipsToWhere` timestamp between (TZ fixed via `process.env.TZ = 'Europe/Paris'` in test setup) -> `{ createdAt: { $gte: '2026-10-31T23:00:00.000Z', $lte: '2026-11-30T22:59:59.999Z' } }`
  - date-only between -> `{ dueDate: { $gte: '2026-11-01', $lte: '2026-11-30' } }`
  - `empty` on nullable -> `{ f: null }`; `notEmpty` -> `{ f: { $ne: null } }`
  - Review Focus: unknown field, unknown op, `_page=abc`, `_page=-1`, bad JSON in `.in` -> dropped, `page` = 1, no throw
  - `operatorsFor` non-nullable string -> no `empty`; nullable date -> includes `between` and `empty`
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(admin): url state and filter model`.

### Task 9: Admin - row draft (green-rows fix)

**Files:**
- Create: `src/lib/table/row-draft.svelte.ts`
- Test: `src/lib/table/row-draft.spec.ts` (`.svelte.spec.ts` if runes need the compiler)

**Interfaces:**
- Produces:
  ```ts
  export class RowDraft<T extends Record<string, any>> {
    constructor(server: T, fields: FieldUIInfo[])
    values: T                       // $state, bound by editors
    readonly dirty: boolean         // $derived
    isDirty(fieldKey: string): boolean
    rebase(server: T): void         // new server row: re-baseline untouched fields, keep edited ones
    reset(): void
    changes(): Partial<T>           // only edited fields, for repo.update
  }
  ```
- Equality: json fields deep (`JSON.stringify` of sorted keys), dates/strings strict, `undefined` == missing. A field never touched by the user is never dirty.

- [ ] **Step 1: Failing tests:**
  - fresh draft -> `dirty === false`
  - `rebase` with changed server value on untouched field -> value updated, still not dirty (the live-query case)
  - edit `name`, then `rebase` with new `status` -> `name` kept + dirty, `status` updated, `isDirty('status') === false` (Review Focus)
  - server row missing a field (`includeInApi` per row) -> not dirty, editor writing `undefined` does not dirty
  - json field same content, new object -> not dirty
  - test named after Task 2's root cause reproducing it, passing
  - `changes()` returns only edited keys
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS. **Step 5:** Commit `feat(admin): row draft with rebase`.

### Task 10: Admin - shell, theme, nav, Cmd+K, settings, toasts

**Files:** `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/lib/shell/*`
**Interfaces:** Consumes `settings`, `session`, `god` (Task 7). Produces `toast.success|error(message: string)` from `Toasts.svelte` module script.

Load `impeccable` + `make-interfaces-feel-better` skills before styling. Look per spec "Look": dense calm data tool, system font, tabular numbers, entity hue as accent only, tokens on `:root` with dark via `prefers-color-scheme` and `[data-theme]`.

- [ ] **Step 1:** Nav: search filters `god.visibleTables` by caption/key (per `displayCaption`), hue dot per entity, active state, collapse toggle (replaces hide-navigation), links to `#/entity/<superKey>` and `#/schema`.
- [ ] **Step 2:** Cmd/Ctrl+K palette (ui-sdk `command`) over visible entities + "Schema" + "Settings".
- [ ] **Step 3:** Settings dialog (ui-sdk dialog): every field of `settings` that's user-facing + bearer token (session) + reset. Opens automatically when `optionsFromServer.requireAuthToken && !session.bearerAuth`, and after a 401.
- [ ] **Step 4:** Restore `lastLocation` on `#/`; save on navigation.
- [ ] **Step 5:** Playwright `tests/e2e/shell.spec.ts`: nav search narrows list; Cmd+K opens entity; hidden entity (demo hook) absent from nav and palette; `requireAuthToken` prompt appears and after entering a token entities load; dark theme toggle sets `data-theme`. Run `npm run e2e` -> PASS.
- [ ] **Step 6:** Commit `feat(admin): shell, nav, palette, settings`.

Demo server prerequisite (do in Step 1): `src/server/api.ts` gets two users switchable via a header or `?user=` (`admin` with role `admin`, `ops` without), and an `entities` hook hiding at least one entity for `ops` and locking one to drawer.

### Task 11: Admin - entity table (read, sort, page, live, URL, permissions)

**Files:** `src/routes/entity/[key]/+page.svelte`, `src/lib/table/Table.svelte`, `Row.svelte`, `Cell.svelte`
**Interfaces:** Consumes `god`, `parseQuery/serializeQuery/chipsToWhere`, `RowDraft`, `toast`. Produces `<Table table={TableInfo} parentWhere?={EntityFilter} urlBound={boolean} />` (nested tables pass `urlBound={false}`).

- [ ] **Step 1:** Data: `find` / `liveQuery` (respect `optionsFromServer.disableLiveQuery` then `settings.disableLiveQuery`), `count`, batch relation captions (port `displayValueForEach`), skeleton, error panel, Forbidden badge, empty state (Review Focus: zero rows -> "No rows" + still-editable filters + "+" if allowed).
- [ ] **Step 2:** Header: key icon, type icon, click sort cycles desc -> asc -> none; pager `from - to of total`; "Copy link" copies `location.href`.
- [ ] **Step 3:** URL binding when `urlBound`: state from `page.url` via `parseQuery`, changes via `goto('#/entity/<k>?' + serializeQuery(...), { replaceState: false, keepFocus: true, noScroll: true })`; page resets to 1 on filter/sort change.
- [ ] **Step 4:** Permissions: hide "+" when `insert === false`; delete hidden / cells read-only when `false`; for `'row'` POST `__row-permissions` with visible ids after each load and live change, apply per row (until answered, treat as read-only).
- [ ] **Step 5:** Playwright `tests/e2e/table.spec.ts`: sort click updates URL and order; page 2 via URL loads rows 26-50; reload keeps state; back button restores previous filter; as `ops`, delete hidden on rows not owned, shown on owned; empty filter result shows empty state. PASS.
- [ ] **Step 6:** Commit `feat(admin): entity table`.

### Task 12: Admin - inline editing + field editors

**Files:** `src/lib/fields/*`, `Row.svelte`, `Cell.svelte`
**Interfaces:** Produces `<FieldEditor field={FieldUIInfo} bind:value readonly={boolean} variant={'cell' | 'form'} />` (Task 13 reuses with `variant="form"`).

- [ ] **Step 1:** Editors: text (+ long-text dialog on overflow, not for ISO timestamps), number (right aligned), boolean (switch or select, never writes on mount), enum/value list (ui-sdk select, preserves id type number vs string), date-only, timestamp (date-time input), color, json (CodeMirror in dialog), relation (Task 14 slot, placeholder button here), nullable clear button, read-only.
- [ ] **Step 2:** Row: dirty highlight per row + per cell from `RowDraft`, save/cancel, Ctrl/Cmd+Enter save row, +Shift all dirty rows, Ctrl/Cmd+Esc cancel (+Shift all), ArrowUp/Down moves to same column, `modelState` errors per cell, toast on other errors, delete with confirm (`settings.confirmDelete`), "+" new row prefilled with `parentWhere` fields.
- [ ] **Step 3:** Edit mode switch in page bar (`inline` | `drawer`), stored in `settings.editMode[superKey]`, hidden when `editModeLocked`; default from server `editMode`. In `drawer` mode cells render read-only.
- [ ] **Step 4:** Playwright `tests/e2e/inline.spec.ts`: open Task, no row is dirty on arrival (green regression); edit + Ctrl+Enter saves; Ctrl+Esc reverts; validation error shows on cell; new row insert; locked entity shows no switch. PASS.
- [ ] **Step 5:** Commit `feat(admin): inline editing and field editors`.

### Task 13: Admin - row drawer (edit + create)

**Files:** `src/lib/table/RowDrawer.svelte`
**Interfaces:** Consumes `FieldEditor variant="form"`, `RowDraft`. Produces `openDrawer(table: TableInfo, row?: any)` (no row = create).

- [ ] **Step 1:** ui-sdk Drawer from right: header (entity hue + caption + id), vertical form of all fields, json inline CodeMirror, save / cancel / delete (per permissions), field errors, unsaved-changes guard on close.
- [ ] **Step 2:** Open via hover ↗ at row start, Space/Enter on focused row, row click in drawer mode; "+" opens create drawer in drawer mode.
- [ ] **Step 3:** Playwright `tests/e2e/drawer.spec.ts`: ↗ opens drawer with row values; edit + save updates table row; create via "+" in drawer mode inserts; Esc with unsaved changes asks to confirm. PASS.
- [ ] **Step 4:** Commit `feat(admin): row drawer`.

### Task 14: Admin - filter bar + relations

**Files:** `src/lib/table/FilterBar.svelte`, `FilterChip.svelte`, `src/lib/fields/RelationField.svelte`, `src/lib/table/RelationTabs.svelte`
**Interfaces:** Consumes `operatorsFor`, `FilterChip`, `TableQuery`.

- [ ] **Step 1:** Filter bar: chips `field - op - value`, popover to edit (ui-sdk popover), "+ Filter", clear all; value inputs: text, number, two numbers for between, `DatePicker mode="range"` for date between, multi-select for enum/value list, searchable relation combobox (port `getItemsForSelect`, 11 items + count, search on caption field), boolean select.
- [ ] **Step 2:** Relation to-one editor: combobox with search + "Unset" when nullable; caption display from batch map, fallback single lookup.
- [ ] **Step 3:** To-many: chevron on row opens tabs per relation (entity hue underline) with nested `<Table urlBound={false} parentWhere=...>`; hidden entities still work here.
- [ ] **Step 4:** Playwright `tests/e2e/filters.spec.ts`: add date between chip -> URL has `.gte` + `.lte`, rows filtered; copy link opened in new page shows same chips and rows; enum `in` with 2 values; relation chip by search; nested relation table of a hidden entity loads. PASS.
- [ ] **Step 5:** Commit `feat(admin): filter bar and relations`.

### Task 15: Admin - schema (ERD) on xyflow 2

**Files:** `src/routes/schema/+page.svelte`, `src/lib/schema/layout.ts`, `src/lib/schema/EntityNode.svelte`
**Test:** `src/lib/schema/layout.spec.ts`

**Interfaces:** `export function layoutEntities(tables: TableInfo[], algo: 'grid-bfs' | 'grid-dfs' | 'line', saved: Record<string, {x:number;y:number}>): { nodes: Node[]; edges: Edge[] }`

- [ ] **Step 1: Failing tests:** saved position wins; unsaved nodes get deterministic positions per algo; edges source/target handles pick the side facing the other node; only `visibleTables` produce nodes.
- [ ] **Step 2:** FAIL. **Step 3:** Port old `Schema.svelte` grouping/position logic into `layout.ts`, render with xyflow 2 (Background, Controls, MiniMap), persist drag end to `settings.schemaPositions`, node click -> entity page. **Step 4:** PASS + manual check in dev.
- [ ] **Step 5:** Commit `feat(admin): schema diagram on xyflow 2`.

### Task 16: Parity sweep, size, polish

**Files:** any admin file; `docs/docs/admin-ui.md`

- [ ] **Step 1:** Walk the spec "Current feature inventory" line by line in dev; tick each in this step's notes or fix. Include: extended entities (`*` caption), caption/key toggle everywhere, GET dedupe, Forbidden badge on 403.
- [ ] **Step 2:** `npm run build`; size of `projects/core/server/get-remult-admin-html.ts` <= 812,243 bytes target, report if > 1MB with visualizer top 5.
- [ ] **Step 3:** Design pass with `impeccable` (critique + polish) on table, drawer, filter bar, light and dark; screenshots into `tmp/reports/remult-admin-revamp/`.
- [ ] **Step 4:** Full checks: root `npx vitest run`, admin `npm run check && npm run test && npm run e2e`, root `npm run build`. All PASS.
- [ ] **Step 5:** Update `docs/docs/admin-ui.md` screenshots/usage. CHANGELOG `### Added`: `New admin UI: drawer editing, shareable filters, permission-aware (link docs).` Commit `feat(admin): parity and polish`.

### Task 17: Demo + video, then PR

**Files:** `tmp/demo/` (gitignored) or the existing demo server; video under `tmp/reports/remult-admin-revamp/`.

- [ ] **Step 1:** Demo runs core built from this branch (`npm run build` root, then link/pack `dist/remult` into the demo) with the two users from Task 10.
- [ ] **Step 2:** Playwright script `tests/e2e/showcase.spec.ts` (skipped in CI) with `video: 'on'`, 16:9 1920x1080, following spec "Video" beats in order; slowMo so actions read.
- [ ] **Step 3:** Review frames; re-run until clean. Output path reported.
- [ ] **Step 4:** Open the one PR from this branch (body via `jyc-pr` skill, minimal), watch checks until green.
