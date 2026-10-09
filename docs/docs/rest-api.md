---
llm: "READ ONLY entity REST API - GET list/by-id, count, groupBy, aggregate, query. Filter, sort, select, paging. No insert/update/delete."
---

# Entity REST API (read)

Read-only endpoints auto-exposed per entity. Mutations (insert / update / delete) are in [REST API (mutations)](/docs/rest-api-mutations).

`POST` here is still a **read** — it always has `?__action=get|count|groupBy|query`. A `POST` **without** `__action` inserts a row.

We'll use the `products` entity (id `7`) as the example.

| Http Method | Description                      | example         | requires     |
| ----------- | -------------------------------- | --------------- | ------------ |
| GET         | array of rows                    | /api/products   | allowApiRead |
| GET         | single row by id                 | /api/products/7 | allowApiRead |
| POST        | same as GET, `where` in the body | see [Actions](#actions) | allowApiRead |

## Sort

`_sort` and `_order` (asc by default). Comma-separated for multiple columns.

```
https://mySite.com/api/products?_sort=price&_order=desc
```

```
https://mySite.com/api/products?_sort=category,price&_order=asc,desc
```

## Filter

```
https://mySite.com/api/products?price.gte=5&price.lte=10
```

### Filter Operators

| operator     | description           | example                                            |
| ------------ | --------------------- | -------------------------------------------------- |
| `none`       | Equal To              | price=10                                           |
| .ne          | Not Equal             | price.ne=10                                        |
| .in          | is in json array      | price.in=%5B10%2C20%5D _(url encoded - `[10,20]`)_ |
| .contains    | Contains a string     | name.contains=ee                                   |
| .notContains | Not contains a string | name.notContains=ee                                |
| .startsWith  | Starts with a string  | name.startsWith=ee                                 |
| .endsWith    | Ends with a string    | name.endsWith=ee                                   |
| .gt          | Greater than          | price.gt=10                                        |
| .gte         | Greater than or equal | price.gte=10                                       |
| .lt          | Lesser than           | price.lt=10                                        |
| .lte         | Lesser than or equal  | price.lte=10                                       |
| .null        | is or is not null     | price.null=true                                    |

- Combine conditions with `&`.

:::warning Unrecognized filters are ignored, not rejected
Filters are built by walking the entity's fields and looking for `<fieldKey>` + a known operator. A parameter that matches no field (typo, `includeInApi: false`, a field the caller can't read) or uses an unknown suffix is never read — the request succeeds and returns the **unfiltered** set.

Relation fields filter by **id only**; there is no nested traversal. `?courier.name=Steve` is parsed as the field `courier` with the unknown operator `.name`, so it silently returns everything:

```
/api/deliveries?courier.name=Steve   // ignored - returns all rows
/api/deliveries?courier=<courier-id> // filters
```

To filter by a related row's value, look the id up first, or expose a [custom filter](/docs/custom-filter) that does the join server-side. When a count comes back suspiciously close to the table total, suspect an ignored parameter.
:::

`$or` / `$not` (and large / nested `$in`) don't fit in the query string. Send them as `where` on a `POST` (see [Actions](#actions)):

```
POST /api/products?__action=get
```

```JSON
{
  "where": {
    "OR": [
      { "category": "books" },
      { "price.lt": 10 }
    ]
  }
}
```

`NOT` works the same way (`"NOT": { "category": "books" }`).

Custom filters (`Filter.createCustom`) use `$custom$<name>`:

```
https://mySite.com/api/orders?%24custom%24activeOrders=%7B%22year%22%3A2024%7D
```

See [EntityFilter](/docs/entityFilter) and [Custom Filters](/docs/custom-filter).

## Select

`_select` — comma-separated fields.

```
https://mySite.com/api/products?_select=id,name,price
```

## Paginate

The remult client defaults to 100 rows. Raw HTTP without `_limit` returns all rows (unless you set [`defaultGetLimit`](/docs/ref_remultserveroptions#defaultgetlimit)).

```
https://mySite.com/api/products?_limit=25
```

```
https://mySite.com/api/products?_limit=5&_page=3
```

:::tip
Combine freely:

```
https://mySite.com/api/products?price.gte=5&price.lte=10&_sort=price&_order=desc&_limit=5&_page=3
```

:::

## Actions

`POST /api/products?__action=<action>` — **read only**. Query-string filters still apply. `get` and `count` require `where` in the body.

| `__action` | body                             | returns                         |
| ---------- | -------------------------------- | ------------------------------- |
| `get`      | `{ "where": ... }`               | array of rows                   |
| `count`    | `{ "where": ... }`               | `{ "count": n }`                |
| `groupBy`  | see [Group by](#group-by-aggregate) | array of groups / one aggregate |
| `query`    | `{ "where"?, "aggregate"? }`     | `{ items, aggregates }`         |

`GET ?__action=count` also works (query-string filters only).

Simple filters can stay on the URL; put the rest in `where`. `where` uses the same operator keys as query params (`price.gte`, `name.contains`, `OR`, `NOT`, `$custom$...`).

### Count

```
https://mySite.com/api/products?price.gte=10&__action=count
```

or

```
POST /api/products?__action=count
```

```JSON
{ "where": { "price.gte": 10 } }
```

returns:

```JSON
{
  "count": 4
}
```

### Group by & aggregate

`POST /api/products?__action=groupBy`

Maps to `repo().groupBy()` / `repo().aggregate()`. Always returns an **array**. `$count` is included on every row. Omit `groupBy` for a single aggregate over the filtered set (what `repo().aggregate()` does).

```JSON
{
  "groupBy": ["category", "inStock"],
  "sum": ["price"],
  "avg": ["price"],
  "min": ["price"],
  "max": ["price"],
  "distinctCount": ["name"],
  "orderBy": [
    { "field": "category" },
    { "field": "price", "operation": "sum", "isDescending": true },
    { "operation": "count", "isDescending": true }
  ],
  "where": { "price.gte": 5 }
}
```

- `groupBy`, `sum`, `avg`, `min`, `max`, `distinctCount` — field-name arrays. Fields with `includeInApi: false` are ignored.
- `orderBy` — `{ field?, operation?, isDescending? }`. `operation` is `count` | `sum` | `avg` | `min` | `max` | `distinctCount`. Omit `operation` to order by a grouped field. To order by the row count, use `{ "operation": "count" }` — **not** `{ "field": "$count" }`, which names no field and is ignored, leaving the groups unordered.
- `_limit` / `_page` page the **groups**. Paging an unordered result gives you an arbitrary subset, so pair `_limit` with an `orderBy` that took effect.

Response:

```JSON
[
  {
    "$count": 3,
    "category": "books",
    "inStock": true,
    "price": { "sum": 42, "avg": 14, "min": 8, "max": 20 },
    "name": { "distinctCount": 3 }
  }
]
```

Aggregate only (no groups) — same endpoint, no `groupBy`:

```JSON
{
  "sum": ["price"],
  "avg": ["price"]
}
```

```JSON
[
  {
    "$count": 12,
    "price": { "sum": 240, "avg": 20 }
  }
]
```

Query-string filters still apply (`POST /api/products?category=books&__action=groupBy`).

### Query (items + aggregates)

`POST /api/products?__action=query`

One round-trip: current page of rows **and** aggregates over the full filtered set (paging/sort/select do **not** apply to the aggregate).

```
POST /api/products?_limit=25&_page=1&_sort=price&_order=desc&__action=query
```

```JSON
{
  "where": { "category": "books" },
  "aggregate": {
    "sum": ["price"],
    "avg": ["price"]
  }
}
```

returns:

```JSON
{
  "items": [ { "id": 7, "name": "...", "price": 20 } ],
  "aggregates": {
    "$count": 12,
    "price": { "sum": 240, "avg": 20 }
  }
}
```

This is what `repo().query({ aggregate })` uses.
