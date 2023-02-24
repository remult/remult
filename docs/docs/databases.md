# Connecting to a Database

To set a database connection for Remult, set the `dataProvider` property of the `options` argument of the remult Express middleware.

Here are examples of connecting to some commonly used back-end databases:

- Postgres
  - [Using `node-postgres` only](#using-node-postgres-pghttpsnode-postgrescom-only)
  - [Using Knex.js](#using-knexjshttpknexjsorg)
- [MySQL](#mysql)
- [MongoDB](#mongodb)
- [SQLite](#sqlite)
- [Microsoft SQL Server](#microsoft-sql-server)
- [Oracle](#oracle)

Remult can also be used to connect entities to local [frontend databases](#frontend-databases).

## Postgres

### Using [node-postgres (pg)](https://node-postgres.com/) only

Install node-postgres:

```sh
npm i pg
```

Modify the API server's main module:

```ts{5,9,13-16}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createPostgresConnection } from "remult/postgres"

const app = express()

const connectionString = "postgres://user:password@host:5432/database"

app.use(
  remultExpress({
    dataProvider:
      createPostgresConnection({
        connectionString // default: process.env["DATABASE_URL"]
      })
  })
)
```

- If `connectionString` is not provided the `DATABASE_URL`environment will be used

::: details Additional options

- **configuration** - can be set to the `pg.PoolConfig` options object or to `heroku`.
  When set to `heroku`, it'll:
  - Use ssl, with the `rejectUnauthorized:false` flag as required by postgres on heroku
  - Disable ssl for non production environments (`process.env["NODE_ENV"] !== "production"`). To use ssl also for dev, set the `sslInDev` option to true.
- **sslInDev** - see `configuration:"heroku"`
  :::

### Using [Knex.js](http://knexjs.org/)

Install knex and node-postgres:

```sh
npm i knex pg
```

Modify the API server's main module:

```ts{5,11-15}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultExpress({
    dataProvider: createKnexDataProvider({
      // Knex client configuration for Postgres
      client: "pg",
      connection: "postgres://user:password@host:5432/database"
    })
  })
)
```

## MySQL

Install knex and mysql2:

```sh
npm i knex mysql2
```

Modify the API server's main module:

```ts{5,11-20}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultExpress({
    dataProvider: createKnexDataProvider({
      // Knex client configuration for MySQL
      client: "mysql2",
      connection: {
        user: "your_database_user",
        password: "your_database_password",
        host: "127.0.0.1",
        database: "test"
      }
    })
  })
)
```

## MongoDB

Install mongodb:

```sh
npm i mongodb
```

Modify the API server's main module:

```ts{5-6,12-16}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { MongoClient } from "mongodb"
import { MongoDataProvider } from "remult/remult-mongo"

const app = express()

app.use(
  remultExpress({
    dataProvider: async () => {
      const client = new MongoClient("mongodb://localhost:27017/local")
      await client.connect()
      return new MongoDataProvider(client.db("test"), client)
    }
  })
)
```

## SQLite

Install knex and sqlite3:

```sh
npm i knex sqlite3
```

Modify the API server's main module:

```ts{5,11-17}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { createKnexDataProvider } from "remult/remult-knex"

const app = express()

app.use(
  remultExpress({
    dataProvider: createKnexDataProvider({
      // Knex client configuration for SQLite
      client: "sqlite3",
      connection: {
        filename: "./mydb.sqlite"
      }
    })
  })
)
```

## Microsoft SQL Server

Install knex and tedious:

```sh
npm i knex tedious
```

Modify the API server's main module:

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
        server: "127.0.0.1",
        database: "test",
        user: "your_database_user",
        password: "your_database_password",
        options: {
          enableArithAbort: true,
          encrypt: false,
          instanceName: `sqlexpress`
        }
      }
    })
  })
)
```

## Oracle

Install knex and oracledb:

```sh
npm i knex oracledb
```

Modify the API server's main module:

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
        connectString: "SERVER"
      }
    })
  })
)
```

## JSON Files

Modify the API server's main module:

```ts{5-6,12-14}
// index.ts

import express from "express"
import { remultExpress } from "remult/remult-express"
import { JsonDataProvider } from "remult"
import { JsonEntityFileStorage } from "remult/server"

const app = express()

app.use(
  remultExpress({
    dataProvider: async () =>
      new JsonDataProvider(new JsonEntityFileStorage("./db"))
  })
)
```

::: tip Note
This is the default database used by Remult if no other `dataProvider` is set.
:::

## Frontend Databases

Although the common use case of `Remult` on the front end, is to call the backend using rest api, in some use cases using a local in browser database can be useful.

### Local Storage

```ts
import { JsonDataProvider, Remult } from "remult"
export const remultLocalStorage = new Remult(new JsonDataProvider(localStorage))
```

### Session Storage

```ts
import { JsonDataProvider, Remult } from "remult"
export const remultSessionStorage = new Remult(
  new JsonDataProvider(sessionStorage)
)
```

### Web Sql

```ts
import { Remult, SqlDatabase, WebSqlDataProvider } from "remult"
export const remultWebSql = new Remult(
  new SqlDatabase(new WebSqlDataProvider("db"))
)
```

### In Memory object array

```ts
import { Remult, InMemoryDataProvider } from "remult"
export const remult = new Remult(new InMemoryDataProvider())
```
