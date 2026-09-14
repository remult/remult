---
llm: "Browser IndexedDbDataProvider from remult - native object stores, typed indexes, filter prefetch, batch insert/delete, dropDatabase/dropTable, optional AES-GCM encryption."
---

# IndexedDB

`IndexedDbDataProvider` is a **browser-only** data provider that stores each entity in a native IndexedDB object store (one row per id). It is not the older JSON-blob helper (`JsonEntityIndexedDbStorage`).

No extra package. Import from `remult`:

```ts
import { IndexedDbDataProvider, Remult } from 'remult'
```

## Basic usage

```ts
import { Entity, Fields, IndexedDbDataProvider, Remult } from 'remult'

@Entity('tasks')
class Task {
  @Fields.cuid()
  id = ''
  @Fields.string()
  title = ''
  @Fields.string()
  status = ''
  @Fields.createdAt()
  createdAt = new Date()
}

const remult = new Remult(new IndexedDbDataProvider()) // db name defaults to 'remult'
const tasks = remult.repo(Task)

await tasks.insert({ title: 'hi', status: 'open' })
console.table(await tasks.find({ where: { status: 'open' } }))
```

Or pass it to `repo` for a one-off call:

```ts
import { IndexedDbDataProvider, repo } from 'remult'

const db = new IndexedDbDataProvider()
console.table(await repo(Task, db).find())
```

Stores are created on first use (`ensureSchema`). Call `db.close()` when you are done with the connection.

## Drop / reset

`IndexedDbDataProvider` and `InMemoryDataProvider` both implement `DroppableDataProvider` — swap them in tests.

```ts
import type { DroppableDataProvider } from 'remult'

async function reset(db: DroppableDataProvider) {
  await db.dropTable(Task) // or repo(Task).metadata
  await db.dropDatabase()
}
```

- **`dropTable`** — deletes that entity's object store (IDB version bump). Next insert / `ensureSchema` recreates it with the same `ensureIndexes`. Autoincrement resets.
- **`dropDatabase`** — closes the connection and deletes the IndexedDB (including `__remult_keys` when encryption is on). The provider stays usable.

## Indexes

Indexes are **IDB-only** (not unique). Declare them with `ensureIndexes` — field keys are typed against the entity. Listing the primary key is skipped. Compound indexes are named by joining db names with `_`.

```ts
const db = new IndexedDbDataProvider('remult', {
  indexes: (x) =>
    x.ensureIndexes(Task, [
      'status',
      'createdAt',
      ['status', 'createdAt'], // → index name `status_createdAt`
    ]),
})
```

## Filter prefetch

`find` / `count` / `groupBy` first try to load a subset from IDB, then apply the rest of the filter in memory.

Order:

1. Primary key (single-id entities): `eq`, `in`, range (`$gt` / `$gte` / `$lt` / `$lte`)
2. Declared indexes, longest compound first — same operators
3. `$or` of prefetchable branches is merged

Extra predicates still run in memory. `$ne`, `null`, and custom filters do not narrow the IDB read (full scan).

```ts
await tasks.find({ where: { status: 'open', title: 'hi' } })
// prefetches via `status` index, then filters `title` in memory
```

## Batch insert / delete

`repo.insert([a, b], { bulk: true })` and `deleteMany` (`delete(ids)` under the hood) each run in **one IndexedDB transaction**. Default `insert([])` is sequential (one write per row).

```ts
await tasks.insert(
  [
    { title: 'a', status: 'open' },
    { title: 'b', status: 'done' },
  ],
  { bulk: true },
)
await tasks.deleteMany({ where: { status: 'done' } })
```

## Encryption

`{ encrypt: true }` encrypts **non-indexed** fields at rest with **AES-GCM 256**. Requires the Web Crypto API (`crypto.subtle`); the constructor throws if it is missing.

This is **not** full security. It stops a casual disk/profile dump and other origins (non-extractable `CryptoKey` wrapped by the browser). It does **not** protect against same-origin XSS / any JS that can use the stored `CryptoKey` to decrypt.

```ts
const db = new IndexedDbDataProvider('remult', {
  indexes: (x) => x.ensureIndexes(Task, ['status']),
  encrypt: true,
})
```

What stays plaintext vs encrypted:

- **Plaintext:** primary key + `ensureIndexes` fields — required for IDB `keyPath` / indexes (prefetch still works)
- **Ciphertext:** everything else as `_enc` (payload) + `_iv` (12-byte IV)

By default Remult generates a **non-extractable** `CryptoKey` and stores it in `__remult_keys`. That auto-key is origin-bound theater vs XSS. Pass `getEncryptionKey` for a stronger secret you control (the key store is then skipped):

```ts
const db = new IndexedDbDataProvider('remult', {
  encrypt: true,
  getEncryptionKey: () => myAesGcmKey, // CryptoKey | Promise<CryptoKey>
})
```

Existing plaintext rows are still readable; the next write encrypts them.

## vs `JsonEntityIndexedDbStorage`

| | `IndexedDbDataProvider` | `JsonEntityIndexedDbStorage` |
| --- | --- | --- |
| Shape | native object store per entity | one JSON blob per entity in a shared store |
| Queries | IDB indexes + prefetch | load whole entity JSON, filter in memory |
| Encryption | optional AES-GCM | none |
| Reset | `dropTable` / `dropDatabase` | `clear()` |

Use `JsonEntityIndexedDbStorage` only when you want `JsonDataProvider` over a blob. See [Offline Support](/docs/offline-support).
