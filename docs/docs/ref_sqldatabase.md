# SqlDatabase

A DataProvider for Sql Databases

#### example:

```ts
const db = new SqlDatabase(new PostgresDataProvider(pgPool))
```

#### see:

[Connecting a Database](https://remult.dev/docs/quickstart#connecting-a-database)

## getDb

Gets the SQL database from the data provider.

#### returns:

The SQL database.

#### see:

[Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)

Arguments:

- **dataProvider** - The data provider.

## createCommand

Creates a new SQL command.

#### returns:

The SQL command.

#### see:

[Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)

## execute

Executes a SQL command.

#### returns:

The SQL result.

#### see:

[Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)

Arguments:

- **sql** - The SQL command.

## wrapIdentifier

Wraps an identifier with the database's identifier syntax.

## ensureSchema

- **ensureSchema**

Arguments:

- **entities**

## getEntityDataProvider

Gets the entity data provider.

#### returns:

The entity data provider.

Arguments:

- **entity** - The entity metadata.

## transaction

Runs a transaction. Used internally by remult when transactions are required

#### returns:

The promise of the transaction.

Arguments:

- **action** - The action to run in the transaction.

## rawFilter

Creates a raw filter for entity filtering.

#### returns:

- The entity filter with a custom SQL filter.

#### example:

```ts
SqlDatabase.rawFilter(
  ({ param }) =>
    `"customerId" in (select id from customers where city = ${param(customerCity)})`,
)
```

#### see:

[Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/custom-filter.html#leveraging-database-capabilities-with-raw-sql-in-custom-filters)

Arguments:

- **build** - The custom SQL filter builder function.

## filterToRaw

Converts a filter to a raw SQL string.

#### see:

[Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/running-sql-on-the-server#leveraging-entityfilter-for-sql-databases)

Arguments:

- **repo**
- **condition**
- **sqlCommand**
- **dbNames**
- **wrapIdentifier**

## LogToConsole

`false` _(default)_ - No logging

`true` - to log all queries to the console

`oneLiner` - to log all queries to the console as one line

a `function` - to log all queries to the console as a custom format

#### example:

```ts
SqlDatabase.LogToConsole = (duration, query, args) => {
  console.log('be crazy ;)')
}
```

## durationThreshold

Threshold in milliseconds for logging queries to the console.

## constructor

Creates a new SQL database.

#### example:

```ts
const db = new SqlDatabase(new PostgresDataProvider(pgPool))
```

Arguments:

- **sql** - The SQL implementation.

## end
