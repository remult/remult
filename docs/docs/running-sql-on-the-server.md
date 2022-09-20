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
const repo = remult.repo(Task);
const sql = SqlDatabase.getDb();
const r = await sql.execute("select count(*) as c from " +  repo.metadata.options.dbName!);
console.log(r.rows[0].c);
```

### Using bound parameters
```ts
const priceToUpdate = 7;
const sql = SqlDatabase.getDb();
let command = sql.createCommand();
await command.execute("update products set price = price + " 
   + command.addParameterAndReturnSqlToken(+priceToUpdate));
```

When executed with  `priceToUpdate = 5`, this code will run the following SQL:
```sql
update products set price = price + $1
Arguments: { '$1': 5 }
```

### Leveraging the Entity metadata
To improve maintainability it makes sense to use in the query the column names as are defined in the entity itself. We can use the `dbNamesOf` function
```ts
const tasks = await dbNamesOf(remult.repo(Task));
const sql = SqlDatabase.getDb();
console.table(await `select ${tasks.title}, ${tasks.completed} from ${tasks}`)
```

### Leveraging EntityFilter for Sql Databases
Sometimes in our sql, we may want to use EntityFilters as sql filters, this is particularly useful if we have refactored complex filters in our code and we want to reuse them.

 we can use the `sqlCondition` utility function for that:

```ts
const repo = remult.repo(Task);
const tasks = await dbNamesOf(remult.repo(Task));
const sql = await SqlDatabase.getDb();
console.table(await sql.execute(
    `select ${tasks.title}, ${tasks.completed} from ${tasks}
      where ${await sqlCondition(repo, { id: [1, 3] })}}`))
```
will result in the following sql:
```sql
select title, completed from tasks where id in (1, 3)
```

#### We can also use this with bound parameters
```ts
const repo = remult.repo(Task);
const tasks = await dbNamesOf(remult.repo(Task));
const sql = await SqlDatabase.getDb();
const command = sql.createCommand();
console.table(await command.execute(
    `select ${tasks.title}, ${tasks.completed} from ${tasks}
      where ${await sqlCondition(repo, { id: [1, 3] }, command)}}`))
```
This will result in the following sql:
```sql
select title, completed from tasks where id in ($1, $2)
Arguments: { '$1': 1, '$2': 3 }

```

## Knex
```ts
const repo = remult.repo(Task);
const knex = KnexDataProvider.getDb();
const r = await knex(repo.metadata.options.dbName!).count()
console.log(r[0].count);
```

### Leveraging the Entity metadata
```ts
const tasks = await dbNamesOf(remult.repo(Task));
const knex = await KnexDataProvider.getDb();
console.table(
    await knex(tasks.$entityName).select(tasks.title,tasks.completed));
```

### Leveraging EntityFilter for Knex 
```ts
const repo = remult.repo(Task);
const knex = KnexDataProvider.getDb();
const r = await knex(repo.metadata.options.dbName!)
    .count()
    .where(await knexCondition(repo, { id: [1, 3] }));
console.log(r[0].count);
```




## MongoDB
```ts
const repo = remult.repo(Task);
const mongo = MongoDataProvider.getDb();
const r = await (await mongo.collection(repo.metadata.options.dbName!)).countDocuments();
console.log(r);
```

### Leveraging EntityFilter for MongoDb
```ts
const repo = remult.repo(Task);
const mongo = MongoDataProvider.getDb();
const r = await (await mongo.collection(repo.metadata.options.dbName!))
    .countDocuments(await mongoCondition(repo, { myId: [1, 2] }) );
console.log(r);
```

## Native postgres
```ts
const repo = remult.repo(Task);
const sql = PostgresDataProvider.getDb();
const r = await sql.query("select count(*) as c from " + repo.metadata.options.dbName!);
console.log(r.rows[0].c);
```

> you can use the Entity Metadata and `sqlCondition` that are used in [SqlDatabase](#leveraging-the-entity-metadata)

## websql
```ts
const repo = remult.repo(Task);
const sql = WebSqlDataProvider.getDb();
sql.transaction(y => {
    y.executeSql("select count(*) as c from " + repo.metadata.options.dbName!, undefined,
        (_,r) => {
            console.log(r.rows[0].c);
        });
});
```
> you can use the Entity Metadata and `sqlCondition` that are used in [SqlDatabase](#leveraging-the-entity-metadata)

