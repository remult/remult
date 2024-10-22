# Microsoft SQL Server

### Step 1: Install Required Packages

Install `knex` and `tedious` to enable Microsoft SQL Server integration.

```sh
npm i knex tedious
```

### Step 2: Configure the `dataProvider`

In your `index.ts` (or server file), configure the `dataProvider` to use Microsoft SQL Server with the following `knex` client configuration:

```ts{5,11-25}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultExpress({
    dataProvider: createKnexDataProvider({
      // Knex client configuration for MSSQL
      client: "mssql",
      connection: {
        server: "127.0.0.1", // SQL Server address
        database: "test", // Your database name
        user: "your_database_user", // SQL Server user
        password: "your_database_password", // Password for the SQL Server user
        options: {
          enableArithAbort: true, // Required option for newer versions of MSSQL
          encrypt: false, // Set to true if using Azure
          instanceName: "sqlexpress", // Optional: Define the SQL Server instance name
        },
      },
    }),
  })
)
```

### Step 3: Use an Existing `knex` Provider (Optional)

If you have an existing `knex` instance, you can easily integrate it with Remult like this:

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultExpress } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: 'mssql', // Specify MSSQL as the client
  connection: {
    // Add your MSSQL connection details here
    server: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'test',
  },
})

const app = express()

app.use(
  remultExpress({
    dataProvider: new KnexDataProvider(knexDb), // Use your existing knex instance
  }),
)
```

### Explanation:

- **`tedious`**: The underlying driver used by `knex` to connect to SQL Server.
- **`client: "mssql"`**: Specifies that we are using Microsoft SQL Server.
- **`createKnexDataProvider`**: Allows you to use `knex` to connect to SQL Server as the data provider for Remult.
- **`options`**: The additional configuration for SQL Server, including `enableArithAbort` and `encrypt`.

This setup lets you easily connect Remult to Microsoft SQL Server using `knex` for query building and `tedious` as the driver.
