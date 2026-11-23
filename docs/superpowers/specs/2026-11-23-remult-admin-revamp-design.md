# Remult Admin revamp - design

## Intent

Remult admin today is a dev tool. Goal: an admin any remult app can turn on in prod, for its real users, each seeing and doing only what their permissions allow. Very functional, very pretty. Keep every current feature, rebuild on a modern stack, ship a showcase video.

Users: anyone a remult app lets in (`admin: { allow }`), from the app's devs to ops/support/end users with limited rights.

## Goals

- Feature parity with today (inventory below), nothing dropped.
- Stack: Svelte 5 (runes), SvelteKit SPA, `@ui-sdk/svelte` (beta, headless behaviors), `@xyflow/svelte` 1.x.
- Permission-aware UI: insert/update/delete affordances follow the current user's rights.
- Two edit surfaces: inline (today) + right drawer (edit + create).
- Filters reworked, incl. date "between"; filter/sort/page in the URL, shareable.
- Fix the "rows show green on arrival" bug.
- Pretty: polished data-tool look, light + dark.
- Showcase video of the new admin.

## Non-goals

- No new data features beyond the list (no bulk import/export, audit log, charts).
- No compound-id / complex-relation support beyond today (existing TODOs stay TODOs).
- No change to how the admin is distributed: still one HTML string inside core.

## Anti-goals

- Admin lets a user attempt an action and only then learn it's forbidden, when the rule is knowable up front.
- Inline edit gets worse than today (speed, keyboard flow).
- Bundle balloons and bloats `remult` for everyone.

## Constraints

- Admin lives in `projects/remult-admin`, imports `projects/core` source directly. Always runs the repo's core (currently 3.5.0-next.2). Demo app for the video uses 3.5.0-next.2.
- Output must be a single self-contained HTML file. `src/misc/build.ts` writes it into `projects/core/server/get-remult-admin-html.ts`; `misc/dedupe-admin-html.ts` dedupes CJS/ESM copies. Keep that pipeline.
- Served at `<rootPath>/admin` (rootPath configurable at runtime), plus `<rootPath>/admin/:id` and `__entities-metadata`. Server injects `window.optionsFromServer` (`rootPath`, `head`, `requireAuthToken`, `disableLiveQuery`). Base path is unknown at build time.
- Size budget: today's file is ~812KB. Target at or below; flag before going over ~1MB.
- Package manager stays npm (existing `package-lock.json`).

## Approaches

1. **SvelteKit SPA, rewrite in place (picked).** adapter-static + fallback, `router.type: 'hash'` (no server routes, works under any base path), `output.bundleStrategy: 'inline'` (single file). Native Kit router, `page.url` for URL state. Keep data layer, rebuild UI.
2. Plain Vite + Svelte 5 + small hash router. Smaller, but we own routing and URL state; loses the native Kit router.
3. Incremental migration of the current app. Fastest to Svelte 5, but drags Svelte 4 libs (`svelte-spa-router`, melt-ui 0.83) and old structure; wrong base for "pretty" + drawer.

Picked 1. Starts with a spike (below) to retire its risks.

## Current feature inventory (parity checklist)

- Nav: entity list, search, per-entity hue, caption/key toggle, hide-nav toggle.
- Schema (ERD): xyflow diagram, layout algorithms (`grid-bfs`, `grid-dfs`, `line`), node positions saved in localStorage, relation edges on the correct side.
- Table: sort (asc/desc/none per column), paging, row count, live query (with server + user toggle), "Forbidden" badge, error display, loading skeleton, id-key icon, column type icons.
- Inline edit: per-row change highlight + save/cancel, Ctrl/Cmd+Enter save row, +Shift all rows, Ctrl/Cmd+Esc cancel (+Shift all), arrow up/down between cells, field-level validation errors (`modelState`), delete with optional confirm, "+" new row (prefilled with parent relation).
- Field editors: string (+ long text dialog on overflow), number, boolean, value lists/enums, date-only (`inputType: 'date'`), color, JSON (CodeMirror dialog), nullable clear, read-only, relation to-one (search dialog, caption field, unset).
- Relations: to-many relations expand under a row as tabbed nested tables, scoped by parent relation.
- Settings: rows per page, confirm delete, diagram layout, caption/key display, bearer token (session storage), custom headers, live query toggle, reset settings. `requireAuthToken` prompts for a token before loading.
- Extended entities (same key registered twice, `_ext_` superKey).
- Http: bearer token from session or from a named localStorage key (`keyForBearerAuth`), custom headers, 2s GET dedupe cache, 403 -> entity marked Forbidden.
- Last visited location restored on `#/`.

## Design

### Stack and build

- SvelteKit 2 + Svelte 5 runes, adapter-static with `fallback`, `router.type: 'hash'`, `bundleStrategy: 'inline'`.
- Dev: keep the demo express server (`src/server`, JSON db CRM entities) mounted via a Vite plugin `configureServer` middleware, as today.
- Build: Kit output -> single HTML -> existing `build.ts` writes `get-remult-admin-html.ts`. `window.optionsFromServer` injection keeps working.
- Replace: `svelte-spa-router` -> Kit routing; melt-ui -> ui-sdk; `@xyflow/svelte` 0.1 -> 1.x; keep CodeMirror.
- Routes (hash): `#/` (home), `#/entity/<superKey>`, `#/schema`.

### Spike first (throwaway, proves the plan)

1. Hash router: query params inside the hash (`#/entity/tasks?status.in=...`) readable/writable via `page.url` + `goto`/`replaceState`, survive reload, shareable.
2. Inline bundle is truly one file and plugs into `build.ts` -> served by core at `/api/admin` with injected options.
3. Size with ui-sdk + xyflow 1 + CodeMirror vs. 812KB budget.
If any fails, stop and report before building on it.

### URL state

- Filter, sort, page in the hash query, using remult's REST query-param format (e.g. `status.in=[...]`, `createdAt.gte=...`, `createdAt.lte=...`, `_sort`, `_order`, `_page`). Reuse core's existing serializer/parser where possible rather than inventing one.
- Back/forward and reload restore state. "Copy link" button in the page bar.
- Nested relation tables keep local state (not in URL).

### Filters

- Filter bar of chips above the table (field - operator - value), click to edit in a popover, add via "+ Filter", clear all. Replaces the modal dialog.
- Operators per type:
  - string: contains, is, is not, starts with, is empty, is not empty
  - number: is, is not, <, <=, >, >=, between
  - date: is, before, after, between (ui-sdk `DatePicker mode="range"`), is empty
  - boolean: is true / is false / is empty (nullable only)
  - enum / value list / relation: is any of, is none of (multi-select; relation via searchable combobox)
- Empty operators only on nullable fields.
- Date semantics (my call): URL stores calendar dates (`createdAt.gte=2026-11-01`), not instants. On timestamp fields they resolve to the viewer's local day boundaries at query time (between = start of first day to end of last day). Date-only fields compare as-is.
- Same field allowed twice is not needed; one chip per field+operator.

### Edit surfaces

- **Inline** (default): as today, keyboard flow preserved.
- **Drawer**: right-side ui-sdk `Drawer`, all fields as a vertical form, relations to-one via combobox, JSON via CodeMirror inline, save/cancel/delete, validation errors per field. Also used for "New item".
- Open drawer: hover icon (↗) at row start, or Space/Enter on focused row.
- **Per-entity mode switch** (remembered in localStorage): `inline` | `drawer`. In `drawer` mode cells are read-only and row click opens the drawer.
- Edit mode per entity comes from the server `entities` hook (see "Server options"). User's saved choice applies only when not locked.

### Server options

One per-entity hook in `remultApi({ admin: { ... } })`, for filtering and tuning by role:

```ts
type AdminEditMode = 'inline' | 'drawer'
type AdminEntityConfig = { editMode?: AdminEditMode; lockEditMode?: boolean }

admin?: Allowed | {
  allow: Allowed
  customHtmlHead?: (remult: Remult) => string
  requireAuthToken?: boolean
  disableLiveQuery?: boolean
  /** false = hidden, true = defaults, object = shown with overrides. Default: all true. */
  entities?: (entity: EntityMetadata, remult: Remult) => boolean | AdminEntityConfig
}
```

Example:

```ts
admin: {
  allow: Allow.authenticated,
  entities: (entity, remult) => {
    if (remult.isAllowed('admin')) return true
    if (!['tasks', 'contacts'].includes(entity.key)) return false
    return { editMode: 'drawer', lockEditMode: true }
  },
}
```

- Resolved server-side per request into `EntityUIInfo` (`hidden`, `editMode`, `editModeLocked`). Defaults: shown, `inline`, not locked.
- Hidden = top level only: gone from nav, Cmd+K and ERD. Still reachable through relations of visible entities (captions, to-one picker, nested to-many tables).
- UI filtering, not security: entity `allowApi*` rules still guard the API.

### Permissions

- `buildEntityInfo` adds per entity: `insert`, `update`, `delete`: `true | false | 'row'`. Computed with the request's `remult`. Function rules can't be told apart from role checks (`allowApiCrud: () => ...` is wrapped as `(_, remult) => fn(remult)`, `Allow.authenticated` is variadic). Decided:
  - Non-function rules (boolean, role, role list): evaluated once, exact `true | false`.
  - Function rules: entity flag is `'row'`. Insert: call with `undefined` in try/catch; boolean result used, throw -> `'row'` (show, server decides).
  - Per-row for `'row'` update/delete: admin-only `__row-permissions` route (same `allow` guard as the admin) takes entity key + ids of the visible rows, loads them, returns `apiUpdateAllowed(row)` / `apiDeleteAllowed(row)` per id. Called after each page load and live-query change; skipped when no flag is `'row'`.
- Core bug to fix (my call, own changeset): `apiInsertAllowed` checks `allowApiUpdate === undefined` instead of `allowApiInsert` (`RepositoryImplementation.ts`). Without the fix, insert-only entities hide "+".
- UI: `false` hides the affordance (no "+", no delete, read-only cells/drawer). Per-row results apply the same per row. Any server rejection still surfaces cleanly (toast + field errors).
- Field `readOnly` stays as today (`apiUpdateAllowed()` per field).
- God.ts no longer fakes `allowApiCrud: true` blindly; client entity mirrors these flags so the client repo fails fast.

### Green-rows bug

Fixed in the rewrite (same PR). Repro on the current admin first, so the root cause is known and covered by a test.

Suspects (confirm by repro before fixing):
- `EditableRow.svelte`: `rowFrozzen` snapshot taken once at mount; live query replaces `row` with fresh data but snapshot never updates -> diff -> green.
- Svelte 4 `<select bind:value>` writes the first option back when the value is `undefined` (booleans, value lists, fields hidden per-row by `includeInApi`).
Rewrite design: change detection compares a draft against the latest server row, re-baselined on every server update to a row that has no local edits.

### Look

My call, refinable during build: dense, calm data-tool aesthetic. System font stack, tabular numbers, subtle borders, per-entity hue as accent only. Light + dark (follows `prefers-color-scheme`, toggle in settings). Toasts (ui-sdk) for save/delete/errors instead of `alert()`. Command palette (ui-sdk `command`, Ctrl/Cmd+K) to jump to entities. Styling via CSS custom properties on ui-sdk's headless parts; no Tailwind (bundle).

### Video

- Demo app: a small remult 3.5.0-next.2 app (reuse the CRM entities from `src/server`), with two users (admin, limited ops) to show permission-aware UI.
- Script beats: entity nav + Cmd+K, inline edit flow, drawer edit + new item, filter chips with date between, copy link -> opens same view, ERD, limited user sees fewer entities, drawer-locked mode, read-only / no delete on rows they don't own, dark mode.
- Recorded with Playwright, 16:9, ~60-90s. Polished cut is a separate task (short-editing tooling) once the admin ships.

## Delivery

One PR: admin rewrite + core server changes (permission flags in `buildEntityInfo`, `__row-permissions` route, `entities` hook, `apiInsertAllowed` fix, public API report, docs, CHANGELOG entry). Green-rows bug is solved by the rewrite's change detection (no separate fix on the old admin). Merged only at full parity + spike passed.

Published 3.5.0-next.2 bakes in the old admin, so the rewrite reaches users through a later release. Video: demo app runs core built from this branch (local pack / link), "3.5" line. Final re-record against the release that ships it.

## Left to the builder

- Component breakdown, file layout, state modules.
- Exact ui-sdk parts per widget, styling details within the look above.
- Test strategy (vitest for filter <-> URL serialization and permission resolution at minimum; Playwright for key flows).
- Whether xyflow layout code is ported or simplified, as long as the three layouts and saved positions remain.
- Docs update in `docs/docs/admin-ui.md` for new server options.
