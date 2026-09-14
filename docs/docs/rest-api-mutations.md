---
llm: "WRITE entity REST API - POST insert, PUT update, DELETE, insertMany, updateMany, deleteMany, upsertMany. Not for querying."
---

# Entity REST API (mutations)

Insert / update / delete endpoints auto-exposed per entity. Filters, sort, select, paging: [REST API (read)](/docs/rest-api).

We'll use the `products` entity (id `7`) as the example.

| Http Method | Description                                      | example                      | requires       | returns            |
| ----------- | ------------------------------------------------ | ---------------------------- | -------------- | ------------------ |
| POST        | insert one row (body = row)                      | /api/products                | allowApiInsert | the new row        |
| POST        | insert many (body = array of rows)               | /api/products                | allowApiInsert | array of new rows  |
| PUT         | update one row by id                             | /api/products/7              | allowApiUpdate | the updated row    |
| DELETE      | delete one row by id                             | /api/products/7              | allowApiDelete | empty              |
| PUT         | update all rows matching the query filter        | /api/products?category=books | allowApiUpdate | `{ "updated": n }` |
| DELETE      | delete all rows matching the query filter        | /api/products?category=books | allowApiDelete | `{ "deleted": n }` |

Collection-level `PUT` / `DELETE` (no id) require a non-empty filter — or `where: "all"` via `POST` `__action`.

`POST` **without** `__action` is always insert. Read operations use `__action=get|count|groupBy|query` — see [REST API (read)](/docs/rest-api#actions).

## Select on write

`_select=none` skips returning the row (empty body).

```
POST /api/products?_select=none
PUT  /api/products/7?_select=none
```

## Actions

`POST /api/products?__action=<action>`. `deleteMany` and `updateMany` require `where` in the body. Query-string filters still apply; `where` uses the same operator keys as [read filters](/docs/rest-api#filter).

| `__action`   | body                                   | returns                | requires       |
| ------------ | -------------------------------------- | ---------------------- | -------------- |
| `deleteMany` | `{ "where": ... }` or `{ "where": "all" }` | `{ "deleted": n }` | allowApiDelete |
| `updateMany` | `{ "where": ..., "set": ... }`         | `{ "updated": n }`     | allowApiUpdate |
| `upsertMany` | `[{ "where": ..., "set": ... }, ...]`  | array of upserted rows | insert/update  |

### deleteMany

```
POST /api/products?__action=deleteMany
```

```JSON
{ "where": { "category": "books" } }
```

```JSON
{ "deleted": 4 }
```

`{ "where": "all" }` deletes every row.

### updateMany

```
POST /api/products?__action=updateMany
```

```JSON
{
  "where": { "category": "books" },
  "set": { "inStock": false }
}
```

```JSON
{ "updated": 4 }
```

`{ "where": "all", "set": { ... } }` updates every row.

Collection `PUT` / `DELETE` with query-string filters are the same operations when the filter is simple.

### upsertMany

```
POST /api/products?__action=upsertMany
```

```JSON
[
  { "where": { "sku": "abc" }, "set": { "price": 9 } },
  { "where": { "sku": "xyz" }, "set": { "price": 12 } }
]
```

Match by `where`; update with `set` if found, otherwise insert `where` + `set`. Returns the upserted rows. `set` may be omitted to ensure the row exists without changing it.

### insert many

`POST /api/products` with an array body (no `__action`):

```JSON
[
  { "name": "Pencil", "price": 1 },
  { "name": "Eraser", "price": 2 }
]
```

Returns the created rows.
