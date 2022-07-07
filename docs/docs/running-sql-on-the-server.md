# Using the underlying database
We understand that remult doesn't cover every use case of querying data from the database, and in some cases you may want to access the underlying database itself on the backend.

Here's the way to do that, based on the `remult` object.

Note that this code can only run on the backend

## SqlDatabase
`SqlDatabase` provides a level of abstraction around all sql based implementations (postgres, websql and more to come);

This can help if you want to switch sql database sometimes in the future.

### Simple sql
```ts
const repo = remult.repo(Task);
const sql = SqlDatabase.getRawDb(remult);
const r = await sql.execute("select count(*) as c from " + repo.metadata.options.dbName!);
console.log(r.rows[0].c);
```

### Using bound parameters
```ts
const priceToUpdate = 7;
const repo = remult.repo(Task);
const sql = SqlDatabase.getRawDb(remult!);
let command = sql.createCommand();
await command.execute("update products set price = price + " 
   + command.addParameterAndReturnSqlToken(+priceToUpdate));
```

When executed with  `priceToUpdate = 5`, this code will run the following SQL:
```sql
update products set price = price + $1
Arguments: { '$1': 5 }
```

:::warning
Running custom SQL is dangerous and prone to SQL injection hacking. Avoid building custom SQL using values that are sent as parameters from outside the server.

Always use the `addParameterAndReturnSqlToken` method to generate database parameters (like the `$1` that you can see in the query) - this can help you reduce the risk of SQL injection
:::

## Native postgres
```ts
const repo = remult.repo(Task);
const sql = PostgresDataProvider.getRawDb(remult);
const r = await sql.query("select count(*) as c from " + repo.metadata.options.dbName!);
console.log(r.rows[0].c);
```

## Knex
```ts
const repo = remult.repo(Task);
const knex = KnexDataProvider.getRawDb(remult);
const r = await knex(repo.metadata.options.dbName!).count()
console.log(r[0].count);
```

## MongoDB
```ts
const repo = remult.repo(Task);
const mongo = MongoDataProvider.getRawDb(remult);
const r = await (await mongo.collection(repo.metadata.options.dbName!)).countDocuments();
console.log(r);
```

## websql
```ts
const repo = remult.repo(Task);
const sql = WebSqlDataProvider.getRawDb(remult);
sql.transaction(y => {
    y.executeSql("select count(*) as c from " + repo.metadata.options.dbName!, undefined,
        (_,r) => {
            console.log(r.rows[0].c);
        });
});

```

## Leveraging the Entity metadata
To improve maintainability it makes sense to use in the query the column names as are defined in the entity itself. We can use the `getEntityDbNames` function
```ts
const repo = remult.repo(Task);
const t = await getEntityDbNames(repo);
const sql = SqlDatabase.getRawDb(remult!);
console.table(await `select ${t.title}, ${t.completed} from ${t.$entityName}`)
```

## Leveraging EntityFilter
Sometimes in our sql, we may want to use EntityFilters as sql filters, we can use a utility function for that:
### Sql
```ts
const repo = remult.repo(Task);
const t = await getEntityDbNames(repo);
const sql = SqlDatabase.getRawDb(remult!);
console.table(await 
`select ${t.title}, ${t.completed} from ${t.$entityName}
    where ${await sqlCondition(repo, { id: [1, 3] })}}`)
```

### Knex
```ts
const repo = remult.repo(Task);
const knex = KnexDataProvider.getRawDb(remult);
const r = await knex(repo.metadata.options.dbName!)
    .count()
    .where(await knexCondition(repo, { id: [1, 3] }));
console.log(r[0].count);
```

### MongoDB
```ts
const repo = remult.repo(Task);
const mongo = MongoDataProvider.getRawDb(remult);
const r = await (await mongo.collection(repo.metadata.options.dbName!))
    .countDocuments(await mongoCondition(repo, { myId: [1, 2] }) );
console.log(r);
```