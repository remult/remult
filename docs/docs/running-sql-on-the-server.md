# Using the underlying database
We understand that remult doesn't cover every use case of querying data from the database, and in some cases you may want to access the underlying database itself on the backend.

Here's the way to do that, based on the `remult` object.

Note that this code can only run on the backend.

:::warning
Running custom SQL is dangerous and prone to SQL injection hacking. Avoid building custom SQL using values that are sent as parameters from outside the server.

Always use the `addParameterAndReturnSqlToken` method to generate database parameters (like the `$1` that you can see in the query) - this can help you reduce the risk of SQL injection
:::

## SqlDatabase
`SqlDatabase` provides a level of abstraction around all sql based implementations (postgres, websql and more to come);

This can help if you want to switch sql database sometimes in the future.

### Simple sql
```ts
const tasks = await dbNamesOf(Task);
const sql = SqlDatabase.getDb();
const r = await sql.execute(`select count(*) as c from ${tasks}`);
console.log(r.rows[0].c);
```
* The `dbNamesOf` function returns an object that exposes the db names of the entity and it's fields. This improves maintainability and allows for better searches in the code

Another example:
```ts
const tasks = await dbNamesOf(Task);
const sql = SqlDatabase.getDb();
console.table(await sql.execute(
  `select ${tasks.title}, ${tasks.completed} 
     from ${tasks}`))
```
### Using bound parameters
```ts
const priceToUpdate = 5;
const products = await dbNamesOf(Product);
const sql = SqlDatabase.getDb();
let command = sql.createCommand();
await command.execute(
  `update ${products} 
      set ${products.price} = 
          ${products.price} + ${command.addParameterAndReturnSqlToken(+priceToUpdate)}`
  );
```

When executed with  `priceToUpdate = 5`, this code will run the following SQL:
```sql
update products set price = price + $1
Arguments: { '$1': 5 }
```


### Leveraging EntityFilter for Sql Databases
Sometimes in our sql, we may want to use EntityFilters as sql filters, this is particularly useful if we have refactored complex filters in our code and we want to reuse them.

 we can use the `sqlCondition` utility function for that:

```ts
const tasks = await dbNamesOf(Task);
const sql = await SqlDatabase.getDb();
const command = sql.createCommand();
console.table(await command.execute(
  `select ${tasks.title}, ${tasks.completed} from ${tasks}
    where ${await SqlDatabase.sqlCondition(Task, { id: [1, 3] }, command)}`))
```
will result in the following sql:
```sql
select title, completed from tasks where id in (1, 3)
```

#### We can also use this with bound parameters
```ts
const tasks = await dbNamesOf(Task);
const sql = await SqlDatabase.getDb();
const command = sql.createCommand();
console.table(await command.execute(
    `select ${tasks.title}, ${tasks.completed} from ${tasks}
      where ${await SqlDatabase.sqlCondition(Task, { id: [1, 3] }, command)}`))
```
This will result in the following sql:
```sql
select title, completed from tasks where id in ($1, $2)
Arguments: { '$1': 1, '$2': 3 }

```

## Knex
```ts
const tasks = await dbNamesOf(Task);
const knex = KnexDataProvider.getDb();
const r = await knex(tasks.$entityName).count()
console.log(r[0].count);
```
* Note that we use the `$entityName` to get the entity name of the table.

Another example:
```ts

```

### Leveraging the Entity metadata
```ts
const tasks = await dbNamesOf(Task);
const knex = await KnexDataProvider.getDb();
console.table(
  await knex(tasks.$entityName)
    .select(tasks.title, tasks.completed));
```

### Leveraging EntityFilter for Knex 
```ts
const tasks = await dbNamesOf(Task);
const knex = KnexDataProvider.getDb();
const r = await knex(tasks.$entityName)
  .count()
  .where(await KnexDataProvider.knexCondition(Task, { id: [1, 3] }));
console.log(r[0].count);
```




## MongoDB
```ts
const tasks = await dbNamesOf(Task);
const mongo = MongoDataProvider.getDb();
const r = await (await mongo.collection(tasks.$entityName)).countDocuments();
console.log(r);
```

### Leveraging EntityFilter for MongoDb
```ts
const tasks = await dbNamesOf(Task);
const mongo = MongoDataProvider.getDb();
const r = await (await mongo.collection(tasks.$entityName))
    .countDocuments(await MongoDataProvider.mongoCondition(Task, { id: [1, 2] }));
console.log(r);

```

## Native postgres
```ts
const tasks = await dbNamesOf(Task);
const sql = PostgresDataProvider.getDb();
const r = await sql.query(`select count(*) as c from ${tasks}`);
console.log(r.rows[0].c);
```

> you can use the Entity Metadata and `sqlCondition` that are used in [SqlDatabase](#leveraging-the-entity-metadata)

## websql
```ts
const tasks = await dbNamesOf(Task);
const sql = WebSqlDataProvider.getDb();
sql.transaction(y => {
    y.executeSql(`select count(*) as c from ${tasks}`, undefined,
    (_, r) => {
        console.log(r.rows[0].c);
    });
});
```
> you can use the Entity Metadata and `sqlCondition` that are used in [SqlDatabase](#leveraging-the-entity-metadata)

