# PostgreSQL

To set up PostgreSQL as the database provider for your Remult application, you'll need to configure the `dataProvider` property in the `api.ts` file.

### Step 1: Install the `node-postgres` package

Run the following command to install the necessary PostgreSQL client for Node.js:

```sh
npm i pg
```

### Step 2: Set the `dataProvider` Property

In the `api.ts` file, configure the `dataProvider` property to connect to your PostgreSQL database:

```ts{3,7,11-15}
import express from "express"
import { remultApi } from "remult/remult-express"
import { createPostgresDataProvider } from "remult/postgres"

const app = express()

const connectionString = "postgres://user:password@host:5432/database"

app.use(
  remultApi({
    dataProvider: createPostgresDataProvider({
      connectionString, // default: process.env["DATABASE_URL"]
      // configuration: {} // optional: a `pg.PoolConfig` object or "heroku"
    })
  })
)
```

### Alternative: Use an Existing PostgreSQL Connection

If you already have a PostgreSQL connection set up, you can pass it directly to Remult:

```ts
import { Pool } from 'pg'
import { SqlDatabase } from 'remult'
import { PostgresDataProvider } from 'remult/postgres'
import { remultApi } from 'remult/remult-express'

const pg = new Pool({
  connectionString: 'your-connection-string-here',
})

const app = express()

app.use(
  remultApi({
    dataProvider: new SqlDatabase(new PostgresDataProvider(pg)),
  }),
)
```

In this example, the `pg.Pool` is used to create the PostgreSQL connection, and `SqlDatabase` is used to interface with the `PostgresDataProvider`.
