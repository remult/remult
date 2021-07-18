# Running sql on the server
Sometimes we need to run SQL on the server to do some advanced sql stuff.

We can do that using the `@BackendMethod`

To do that we need to add an optional parameter for the `@BackendMethod` of type `SqlDatabase`
```ts{5-9}
@BackendMethod({ allowed: authenticated })
static async updatePriceOnBackend(
  priceToUpdate: number,
  context?: Context,
  sql?: SqlDatabase
) {
  let command = sql.createCommand();
  await command.execute("update products set price = price + " 
    + command.addParameterAndReturnSqlToken(+priceToUpdate));
}
```

The `SqlDatabase` parameter will be injected with an object that can run sql.

When executed with  `priceToUpdate = 5`, this code will run the following sql:
```sql
update products set price = price + $1
Arguments: { '$1': 5 }
```

:::warning
Running custom sql is dangerous and prone to sql injection hacking. Avoid building custom sql using values that are sent as parameters from outside the server.

Always use the `addParameterAndReturnSqlToken` method to generate database parameters (like the `$1` that you can see in the query) - this can help you reduce the risk of SQL injection
:::

