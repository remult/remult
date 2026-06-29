---
name: remult
description: Remult patterns - entities, fields, repo() usage, lifecycle hooks, permissions (allowApi + apiPrefilter), upsert, customFilter, sqlExpression, ValueList enums, relations, BackendMethod, and keeping server-only / Node-only code (fs, sharp, ...) out of the client bundle with `import.meta.env.SSR`. Use whenever writing or modifying Remult entities, configuring API permissions, working with `repo()`, writing a BackendMethod, guarding server-only code, or building CRUD flows in any Remult-powered app (React, Angular, Vue, SvelteKit, Next.js, SolidStart, Nuxt).
---

# Remult

[Remult](https://remult.dev) is a full-stack TypeScript framework: define an entity once, get a typed REST API, a typed client, validation, and permissions everywhere.

**Need more docs? Fetch <https://remult.dev/llms.txt>** - it's the curated index of every doc page. Pull the specific page you need from there.

## `repo()` Usage

Always call `repo(Entity)` inline - never store in a variable. It's cheap, context-aware (frontend/backend), and per-request scoped.

```ts
await repo(Task).find(...)
```

## Entity ID Field

Prefer `@Fields.id()` (UUID, no DB autoincrement coupling). Use `@Fields.autoIncrement()` only if a numeric DB-side sequence is required.

```ts
@Fields.id()
id!: string
```

## Entity Declaration

```ts
import { Entity, Fields, Allow } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: Allow.authenticated,
  allowApiDelete: 'admin',
})
export class Task {
  @Fields.id() id!: string
  @Fields.string() title = ''
  @Fields.boolean() completed = false
}
```

## Permissions: `allowApi*` vs. `apiPrefilter`

Two layers, applied in order:

1. **`allowApi*`** - entity-level gate. Accepts `boolean | Allow.* | Role | Role[] | (item, remult) => boolean`. Decides _whether_ a caller can hit this entity for read/insert/update/delete at all. Keys: `allowApiCrud`, `allowApiRead`, `allowApiInsert`, `allowApiUpdate`, `allowApiDelete`.
2. **`apiPrefilter`** - row-level filter. Returns an `EntityFilter` that's automatically AND-ed into every API query (`find`, `count`, updates, deletes). Decides _which rows_ the caller can see/touch.

```ts
@Entity<Task>('tasks', {
  allowApiRead: Allow.authenticated,
  apiPrefilter: () =>
    remult.isAllowed('admin')
      ? {}                              // admins see all
      : { ownerId: remult.user!.id },   // everyone else: own rows only
})
```

Use `apiPrefilter` for row-level security - never recreate the WHERE clause on the client. The prefilter runs server-side regardless of what the client sends.

## Lifecycle Hooks

Order on save: `saving` -> save -> `saved`. On delete: `deleting` -> delete -> `deleted`. Each hook receives `(entity, event)`; `event.isNew` distinguishes insert from update.

```ts
@Entity<Post>('posts', {
  saving(entity, event) {
    if (event.isNew && remult.user) entity.userId = remult.user.id
  },
  async saved(entity, event) {
    if (event.isNew) {
      // server-only side effect
    }
  },
})
```

### Server-only Code in Hooks / BackendMethods

For Node-only deps (`sharp`, `fs`, ...), wrap the server section in `if (import.meta.env.SSR) { ... }` and dynamically `import()` inside the block. Vite drops the entire branch from the client bundle.

```ts
@BackendMethod({ allowed: true })
static async log(msg: string) {
  if (import.meta.env.SSR) {
    const { appendFileSync } = await import('fs')
    appendFileSync('./logs/log.txt', `${new Date().toISOString()} ${msg}\n`)
    return { status: 'ok' }
  }
  // Unreachable on the server (SSR is build-time true). When the method returns a
  // value, `return` inside the block and `throw` here to keep the return type clean
  // (no `| undefined`).
  throw new Error('server-only')
}
```

Same pattern in hooks:

```ts
@Entity<Post>('posts', {
  saved: async (post) => {
    if (import.meta.env.SSR) {
      const { appendFileSync } = await import('fs')
      appendFileSync('./logs/log.txt', `${new Date().toISOString()} saved ${post.id}\n`)
    }
  },
})
```

**Do not use `if (!import.meta.env.SSR) return` as an early-return** - it does NOT strip the Node-only deps from the client bundle. Always wrap the server-only section in `if (import.meta.env.SSR) { ... }`.

For more (abstract-the-call, bundler exclusion), see <https://remult.dev/docs/using-server-only-packages>.

## Entity-first vs. BackendMethod

Remult's main lever: put logic in entity hooks and let clients call `repo(X).insert/update/delete`. Reach for `BackendMethod` only for genuinely cross-entity or client-invisible flows.

| Entity hook (preferred)    | BackendMethod (when needed)                |
| -------------------------- | ------------------------------------------ |
| Default a field on insert  | Multi-entity transactions                  |
| Per-row validation         | Aggregations across many repos             |
| Single-row side effects    | Cross-entity bulk/clone ops                |
| Image optimization on save | Reads from entities not exposed to clients |

## Repository Methods - `upsert`

`upsert` matches by `where`, updates with `set` if found, inserts if not. Idempotent and works in single or batch form.

```ts
// single
await repo(Task).upsert({
  where: { slug: 'hello' },
  set: { title: 'Hello' },
})

// batch
await repo(Task).upsert([
  { where: { slug: 'a' }, set: { title: 'A' } },
  { where: { slug: 'b' }, set: { title: 'B' } },
])
```

Use it instead of hand-rolling find-then-insert-or-update.

## ValueList Enums

Use over `@Fields.enum` / `@Fields.literal` it's more future-proof, supports extra properties (label, color, etc.) and behavior on each value, and is easier to maintain as the list grows.

```ts
import { ValueListFieldType, getValueList, ValueListInfo } from 'remult'

@ValueListFieldType()
export class TaskStatus {
  static Open = new TaskStatus('open', 'Open', '#22c55e')
  static Done = new TaskStatus('done', 'Done', '#94a3b8')
  constructor(
    public id: string,
    public caption: string,
    public color: string,
  ) {}
}

for (const s of getValueList(TaskStatus)) {
  // s.id, s.caption, s.color
}
```

`getValueList(EnumClass | fieldRef | fieldMetadata)` returns the values (use to populate dropdowns). `id` is what's stored in the DB and sent over the API; `caption` is what you display.

### Binding to `<select>` / query string

Cross any string boundary (HTML inputs, URLs, FormData, localStorage) via `ValueListInfo.get(EnumClass)`:

- `toInput(instance)` -> the `id` as a string
- `fromInput(idString)` -> the instance

```tsx
const info = ValueListInfo.get(TaskStatus)

// React <select>
<select
  value={info.toInput(task.status)}
  onChange={(e) => setTask({ ...task, status: info.fromInput(e.target.value) })}
>
  {getValueList(TaskStatus).map((s) => (
    <option key={s.id} value={info.toInput(s)} style={{ color: s.color }}>
      {s.caption}
    </option>
  ))}
</select>

// URL <-> instance
const params = new URLSearchParams(location.search)
const status = info.fromInput(params.get('status') ?? '')
params.set('status', String(info.toInput(TaskStatus.Open)))
```

In Svelte/Vue/Angular template syntax with two-way binds on objects, you bind the **instance** directly and skip `toInput`/`fromInput` - reach for them only when something forces strings.

## Field Metadata in the UI

Don't hard-code field labels, types, or validators in templates - read them from `repo(X).metadata.fields.<field>` so a single source of truth drives the UI.

```ts
@Entity('tasks', { allowApiCrud: true })
export class Task {
  @Fields.string({ label: 'Task title' })
  title = ''
}

const f = repo(Task).metadata.fields.title
f.label // 'Task title'
f.key // 'title'        (the field name)
f.valueType // String
f.options // raw FieldOptions (validate, includeInApi, ...)
```

```tsx
<label htmlFor={f.key}>{f.label}</label>
<input id={f.key} placeholder={f.label} value={task.title} />
```

If a field doesn't set `label`, remult auto-generates one from the key (`firstName` -> `First Name`). Same auto-titleising applies to ValueList items.

## Permission Checks in UI

Use entity metadata - never duplicate permission logic in components.

```ts
const canEdit = repo(Post).metadata.apiUpdateAllowed(post)
const canDelete = repo(Post).metadata.apiDeleteAllowed(post)
const canInsert = repo(Post).metadata.apiInsertAllowed
```

These re-evaluate with the current `remult.user` and (where relevant) the row, mirroring the server-side check exactly.

## Relations - Typed Includes

```ts
@Fields.string()
authorId = ''

@Relations.toOne(() => User, { field: 'authorId' })
author?: User
```

Read with `include`:

```ts
await repo(Post).find({ include: { author: true } })
```

For one-to-many: `@Relations.toMany(() => Comment, 'postId')`.

## Reusable Filters - `Filter.createCustom`

Encapsulate complex/computed WHERE logic so it's reusable, type-safe, and runs server-side.

```ts
import { Entity, Fields, Filter, repo } from 'remult'

@Entity('orders')
export class Order {
  @Fields.id() id!: string
  @Fields.string() status = ''
  @Fields.createdAt() createdAt = new Date()

  static activeIn = Filter.createCustom<Order, { year: number }>(
    async ({ year }) => ({
      status: { $in: ['created', 'pending', 'confirmed'] },
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
    }),
  )
}

await repo(Order).find({ where: Order.activeIn({ year: 2024 }) })
```

The arg generic types the call site; the filter body always runs on the server.

## Computed Fields - `sqlExpression`

Fields backed by a SQL expression instead of a physical column. Filterable and sortable in one round-trip, no row loading.

```ts
@Entity('tasks')
export class Task {
  @Fields.id() id!: string
  @Fields.string() title = ''

  @Fields.integer({ sqlExpression: () => 'length(title)' })
  titleLength = 0
}

await repo(Task).find({ where: { titleLength: { $gt: 10 } } })
```

The function form receives `(entity, args?, command?)` so you can build dynamic expressions; pair with `dbNamesOf(Entity)` for safe identifiers.

## SQL-Driven Relations / Derived Joins

Inline a related value via subquery using `sqlExpression` + `dbNamesOf`. Flat shape, single query, fully queryable from the API.

```ts
import { dbNamesOf, Entity, Fields, repo } from 'remult'

@Entity('orders')
export class Order {
  @Fields.id() id!: string
  @Fields.string() customerId = ''

  @Fields.string<Order>({
    sqlExpression: async () => {
      const cust = await dbNamesOf(Customer)
      const ord = await dbNamesOf(Order)
      return `(select ${cust.city} from ${cust} where ${cust.id} = ${ord.customerId})`
    },
  })
  customerCity = ''
}

await repo(Order).find({ where: { customerCity: 'London' } })
```

Use this when you want a derived column queryable by the API client without exposing the related entity or doing N+1.

## Sharing Shape Across Entities

Prefer **class extends class** for shared fields + hooks. Concrete entities extend a base class.

```ts
abstract class Auditable {
  @Fields.id() id!: string
  @Fields.createdAt() createdAt = new Date()
  @Fields.string() createdBy = ''
}

@Entity<Post>('posts', { allowApiCrud: Allow.authenticated })
export class Post extends Auditable {
  @Fields.string() title = ''
  @Fields.string() body = ''
}

@Entity<Comment>('comments', { allowApiCrud: Allow.authenticated })
export class Comment extends Auditable {
  @Fields.string() postId = ''
  @Fields.string() text = ''
}
```

For shared _options_ (permissions, hooks), extract a typed helper returning `EntityOptions<T>` and spread it into each `@Entity({...})`.

## Module Pattern

Bundle related entities + init logic into a module so apps register them in one line. See <https://remult.dev/docs/modules>.

## Quick References

- Entity options: <https://remult.dev/docs/ref_entity>
- Field options: <https://remult.dev/docs/ref_field>
- Repository API: <https://remult.dev/docs/ref_repository>
- EntityFilter: <https://remult.dev/docs/entityFilter>
- Custom filters: <https://remult.dev/docs/custom-filter>
- Access control: <https://remult.dev/docs/access-control>
- BackendMethod: <https://remult.dev/docs/ref_backendmethod>
- Validators: <https://remult.dev/docs/ref_validators>
- Migrations: <https://remult.dev/docs/migrations>
- Admin UI: <https://remult.dev/docs/admin-ui>
- Full doc index: <https://remult.dev/llms.txt>
