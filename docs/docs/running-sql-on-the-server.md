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
