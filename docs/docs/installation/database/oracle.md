## Oracle Database

To use an Oracle database as the data provider for your Remult-based application, follow these steps:

### Step 1: Install Required Packages

Install `knex` and `oracledb`:

```sh
npm i knex oracledb
```

### Step 2: Configure the `dataProvider`

In your `index.ts` (or server file), configure the `dataProvider` to use Oracle through `knex`:

```ts{5,11-19}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultExpress({
    dataProvider: createKnexDataProvider({
      // Knex client configuration for Oracle
      client: "oracledb",
      connection: {
        user: "your_database_user",
        password: "your_database_password",
        connectString: "SERVER" // Specify your Oracle server connection string
      }
    })
  })
)

app.listen(3000, () => console.log("Server is running on port 3000"))
```

### Step 3: Using an Existing `knex` Provider

If you're already using a `knex` instance, you can easily plug it into Remult:

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultExpress } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: 'oracledb',
  connection: {
    user: 'your_database_user',
    password: 'your_database_password',
    connectString: 'SERVER',
  },
})

const app = express()

app.use(
  remultExpress({
    dataProvider: new KnexDataProvider(knexDb), // Reuse your existing knex provider
  }),
)

app.listen(3000, () => console.log('Server is running on port 3000'))
```

### Explanation:

- **Knex configuration**: `client: "oracledb"` indicates you're using Oracle, and `connection` contains the necessary credentials and connection string.
- **Existing knex provider**: If you already have a `knex` instance, it can be reused directly with Remult.

This setup integrates Oracle into your Remult-based application.
