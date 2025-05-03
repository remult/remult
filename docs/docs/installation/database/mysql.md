# MySQL

### Step 1: Install `knex` and `mysql2`

Run the following command to install the required packages:

```sh
npm i knex mysql2
```

### Step 2: Set the `dataProvider` Property

In your `api.ts` file, configure the `dataProvider` to connect to your MySQL database using `Knex`:

```ts{3,9-18}
import express from "express"
import { remultApi } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultApi({
    dataProvider: createKnexDataProvider({
      client: "mysql2", // Specify the MySQL client
      connection: {
        user: "your_database_user",
        password: "your_database_password",
        host: "127.0.0.1",
        database: "test",
      },
    }),
  })
)
```

### Alternative: Use an Existing Knex Provider

If you're already using a `knex` instance in your project, you can pass it directly to Remult:

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultApi } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: 'mysql2',
  connection: {
    user: 'your_database_user',
    password: 'your_database_password',
    host: '127.0.0.1',
    database: 'test',
  },
})

const app = express()

app.use(
  remultApi({
    dataProvider: new KnexDataProvider(knexDb), // Use the existing knex instance
  }),
)
```
