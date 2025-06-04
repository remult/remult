## DuckDB

To use DuckDB as the database provider in your Remult-based application, follow these steps:

### Step 1: Install DuckDB

Run the following command to install `@duckdb/node-api`:

```sh
npm i @duckdb/node-api
```

### Step 2: Configure the `dataProvider`

In your `index.ts` (or server file), configure the `dataProvider` to use DuckDB:

```ts
import express from 'express'
import { remultApi } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import { DuckDBInstance } from '@duckdb/node-api' // [!code highlight]
import { DuckDBDataProvider } from 'remult/remult-duckdb' // [!code highlight]

const app = express()

app.use(
  remultApi({
    dataProvider: new SqlDatabase( // [!code highlight]
      new DuckDBDataProvider(
        (await DuckDBInstance.create(':memory:')).connect(),
      ), // [!code highlight]
    ), // [!code highlight]
  }),
)

app.listen(3000, () => console.log('Server is running on port 3000'))
```

### Explanation:

- **DuckDB setup**: The database is initialized with `DuckDBInstance.create(':memory:')` to create an in-memory database. Replace `':memory:'` with a file path if you want to persist the database to disk.
- **SqlDatabase**: `SqlDatabase` is used to connect Remult with DuckDB through the `DuckDBDataProvider`.

This setup allows you to use DuckDB as your database provider in a Remult project.
