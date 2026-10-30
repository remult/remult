---
llm: "Run raw SQL via SqlDatabase.getDb(), dbNamesOf for safe identifiers, and param() for bound parameters."
---

# Accessing the Underlying Database in Remult

While Remult provides a powerful abstraction for working with databases, there might be scenarios where you need to access the underlying database directly. This could be for performing complex queries, optimizations, or other database-specific operations that are not covered by Remult's API.

:::warning
Directly executing custom SQL can be dangerous and prone to SQL injection attacks. Always use parameterized queries and the `param` method provided by Remult to safely include user input in your queries.
:::

## Accessing SQL Databases

For SQL-based databases, Remult provides the SqlDatabase class to interact directly with the database and allows you to run raw SQL queries directly. This is useful for executing complex queries that involve operations like GROUP BY, bulk updates, and other advanced SQL features.

### Basic SQL Query

```typescript
const sql = SqlDatabase.getDb()
const result = await sql.execute('SELECT COUNT(*) AS count FROM tasks')
console.log(result.rows[0].count)
```

This approach is straightforward but can lead to inconsistencies if the database schema changes.

#### the `dbNamesOf` function:

The `dbNamesOf` function dynamically retrieves the database table and column names based on your entity definitions, ensuring that your queries stay in sync with your data model. This enhances consistency, maintainability, and searchability in your code.

```typescript
const tasks = await dbNamesOf(Task)
const sql = SqlDatabase.getDb()
const result = await sql.execute(`SELECT COUNT(*) AS count FROM ${tasks}`)
console.log(result.rows[0].count)
```

##### Create index example

```typescript
const tasks = await dbNamesOf(Task)
const sql = SqlDatabase.getDb()
await sql.execute(`CREATE INDEX idx_task_title ON ${tasks}(${tasks.title});`)
```

### Using Bound Parameters

The `param` method safely incorporates user input into the query, reducing the risk of SQL injection by using parameterized queries.

```typescript
const priceToUpdate = 5
const products = await dbNamesOf(Product)
const sql = SqlDatabase.getDb()
let command = sql.createCommand()
await command.execute(
  `UPDATE ${products} SET ${products.price} = ${
    products.price
  } + ${command.param(priceToUpdate)}`,
)
```

When executed, this code will run the following SQL:

```sql
UPDATE products SET price = price + $1
Arguments: { '$1': 5 }
```

### Leveraging EntityFilter for SQL Databases

The `filterToRaw` function converts Remult's `EntityFilter` objects into SQL where clauses, enabling you to incorporate complex filtering logic defined in your models into custom SQL queries. This allows for reusability and integration with backend filters.

#### Benefits of filterToRaw

- **Reusability**: Allows you to reuse complex filters defined in your Remult models in custom SQL queries.
- **Integration**: Respects any **backendPrefilter** and **backendPreprocessFilter** applied to your entities, ensuring consistent access control and data manipulation rules.

```typescript
const order = await dbNamesOf(Order)
const sql = SqlDatabase.getDb()
const command = sql.createCommand()
const filterSql = await SqlDatabase.filterToRaw(
  Order,
  {
    status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
  },
  command,
)
const result = await command.execute(
  `SELECT COUNT(*) FROM ${order} WHERE ${filterSql}`,
)
console.log(result.rows[0].count)
```

Resulting SQL:

```sql
SELECT COUNT(*) FROM "orders"
WHERE "status" IN ($1, $2, $3, $4, $5) AND "createdAt" >= $6 AND "createdAt" < $7
```

Using `customFilter`:

```typescript
const order = await dbNamesOf(Order)
const sql = SqlDatabase.getDb()
const command = sql.createCommand()
const filterSql = await SqlDatabase.filterToRaw(
  Order,
  Order.activeOrders({ year, customerCity: 'London' }),
  command,
)
const result = await command.execute(
  `SELECT COUNT(*) FROM ${order} WHERE ${filterSql}`,
)
console.log(result.rows[0].count)
```

Resulting SQL:

```sql
SELECT COUNT(*) FROM "orders"
WHERE "status" IN ($1, $2, $3, $4, $5) AND "createdAt" >= $6 AND "createdAt" < $7 AND ("orders"."customerId" IN (
      SELECT "customers"."id" FROM "customers"
             WHERE "customers"."city" = $8
        ))
```

### Building a select with remult

`filterToRaw` gives you the `WHERE`. When you need the rest of the statement remult would run - the column list with its `sqlExpression` fields, the aggregates and `GROUP BY` of a `groupBy`, the conversion of each result column back to a field value - `selectToRaw` and `groupByToRaw` build it without running it:

```typescript
const { sql, toResult } = await SqlDatabase.groupByToRaw(repo(Order), {
  group: ['status'],
  sum: ['amount'],
  where: Order.activeOrders({ year }),
})
// sql:
//   select count(*) as "count", "status" as "status", sum( "amount" ) as "amount_sum"
//    from "orders" where ... group by "status"
const result = await SqlDatabase.getDb().execute(sql)
const rows = result.rows.map(toResult)
// rows: [{ $count: 12, status: 'created', amount: { sum: 340 } }, ...] - the shape repo.groupBy returns
```

Both return the statement and a `toResult` that maps one result row, read by column alias, to the shape the matching repository method returns (`groupBy` for `groupByToRaw`, the fields' values for `selectToRaw`). Every column is aliased through the data provider's `wrapIdentifier`, so the aliases survive databases that fold unquoted names to lower case.

**When to use them.** Only for a statement remult cannot run on its own. The common case is one statement over several databases on the same server - a `UNION ALL` of the same aggregate per database instead of a connection and a query per database:

```typescript
const command = SqlDatabase.getDb().createCommand()
const names = await dbNamesOf(Order)
const branches = await Promise.all(
  databases.map(async (database) => {
    const { sql, toResult } = await SqlDatabase.groupByToRaw(
      repo(Order),
      { group: ['status'], where: { createdAt: { $gte: from } } },
      {
        sqlCommand: command, // one parameter list for the whole statement
        dbNames: { ...names, $entityName: `"${database}".public."orders"` },
      },
    )
    return { sql: `select '${database}' as database, * from (${sql}) t`, toResult }
  }),
)
const result = await command.execute(branches.map((b) => b.sql).join('\nunion all\n'))
const rows = result.rows.map((row) => ({ database: row.database, ...branches[0].toResult(row) }))
```

What the options give you:

- `sqlCommand` - the command that collects the bound parameters. Pass the same command to every branch of a combined statement, then `execute` on it. Without one the values are inlined as literals, which is fine for a statement you only print.
- `dbNames` - how the table and columns are addressed. Start from `dbNamesOf(entity)` and replace `$entityName` to point at another database or an alias; the column names are left as they are.
- `wrapIdentifier` - the quoting to use when `dbNames` isn't given. Defaults to the repository's data provider's, so the statement matches what remult itself would run.
- `limitSyntax` - required only with `limit`, because paging syntax differs per dialect: `(limit, offset) => \`limit ${limit} offset ${offset}\``.

`selectToRaw` adds no `ORDER BY` of its own (a branch of a `UNION` may not have one) - pass `orderBy` only when you want it in the statement. Both respect `backendPrefilter` and custom filters, exactly like `filterToRaw`. For anything a single repository call can express, call the repository: these exist for the statement shape, not as a faster path.

## Accessing Other Databases

## Knex

```typescript
const tasks = await dbNamesOf(Task)
const knex = KnexDataProvider.getDb()
const result = await knex(tasks.$entityName).count()

console.log(result[0].count)
```

### Leveraging EntityFilter for Knex

```ts
const tasks = await dbNamesOf(Task)
const knex = KnexDataProvider.getDb()
const r = await knex(tasks.$entityName)
  .count()
  .where(await KnexDataProvider.filterToRaw(Task, { id: [1, 3] }))
console.log(r[0].count)
```

## MongoDB

```ts
const tasks = await dbNamesOf(Task)
const mongo = MongoDataProvider.getDb()
const r = await(await mongo.collection(tasks.$entityName)).countDocuments()
console.log(r)
```

### Leveraging EntityFilter for MongoDb

```ts
const tasks = await dbNamesOf(Task)
const mongo = MongoDataProvider.getDb()
const r = await(await mongo.collection(tasks.$entityName)).countDocuments(
  await MongoDataProvider.filterToRaw(Task, { id: [1, 2] }),
)
console.log(r)
```

## Native postgres

```ts
const tasks = await dbNamesOf(Task)
const sql = PostgresDataProvider.getDb()
const r = await sql.query(`select count(*) as c from ${tasks}`)
console.log(r.rows[0].c)
```

## Conclusion

Accessing the underlying database directly in Remult provides the flexibility to handle complex use cases that might not be covered by the ORM layer. However, it's important to use this capability judiciously and securely, especially when dealing with user input, to avoid potential security vulnerabilities like SQL injection. By leveraging utilities like `dbNamesOf` and `filterToRaw`.
