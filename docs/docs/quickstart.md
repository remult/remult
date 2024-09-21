# Quickstart

Jumpstart your development with this Quickstart guide. Learn to seamlessly integrate Remult in various stacks, from installation to defining entities for efficient data querying and manipulation.

### Experience Remult with an Interactive Tutorial

For a guided, hands-on experience, [try our interactive online tutorial](https://learn.remult.dev/). It's the fastest way to get up and running with Remult and understand its powerful features.

## Installation

The _remult_ package is all you need for both frontend and backend code. If you're using one `package.json` for both frontend and backend (or a meta-framework) - **install Remult once** in the project's root folder. If you're using multiple `package.json` files (monorepo) - **install Remult in both server and client folders**.

::: code-group

```sh [npm]
npm install remult
```

```sh [yarn]
yarn add remult
```

```sh [pnpm]
pnpm add remult
```

```sh [bun]
bun add remult
```

:::

## Server-side Initialization

Remult is initialized on the server-side as a request handling middleware, with **a single line of code**. Here is the code for setting up the Remult middleware:

::: code-group

```ts [Express]
import express from 'express'
import { remultExpress } from 'remult/remult-express'

const app = express()

app.use(remultExpress({})) // [!code highlight]

app.listen(3000)
```

<!-- prettier-ignore-start -->
```ts [Fastify]
import fastify from 'fastify'
import { remultFastify } from 'remult/remult-fastify'

(async () => {
  const server = fastify()

  await server.register(remultFastify({})) // [!code highlight]

  server.listen({ port: 3000 })
})()
```
<!-- prettier-ignore-end -->

```ts [Next.js]
// src/app/api/[...remult]/route.ts

import { remultNextApp } from 'remult/remult-next'

export const api = remultNextApp({}) // [!code highlight]

export const { GET, POST, PUT, DELETE } = api
```

```ts [Sveltekit]
// src/routes/api/[...remult]/+server.ts

import { remultSveltekit } from 'remult/remult-sveltekit'

export const _api = remultSveltekit({}) // [!code highlight]

export const { GET, POST, PUT, DELETE } = _api
```

```ts [nuxt.js]
// server/api/[...remult].ts

import { remultNuxt } from 'remult/remult-nuxt'

export const api = remultNuxt({})

export default defineEventHandler(api)

// enable experimental decorators
// Add to nuxt.config.ts
  nitro: {
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
  },
  vite: {
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },


```

<!-- prettier-ignore-start -->
```ts [Hapi]
import { type Plugin, server } from '@hapi/hapi'
import { remultHapi } from 'remult/remult-hapi'

(async () => {
  const hapi = server({ port: 3000 })

  await hapi.register(remultHapi({})) // [!code highlight]

  hapi.start()
})()
```
<!-- prettier-ignore-end -->

```ts [Hono]
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { remultHono } from 'remult/remult-hono'

const app = new Hono()

const api = remultHono({}) // [!code highlight]
app.route('', api) // [!code highlight]

serve(app)
```

```ts [Nest]
// src/main.ts

import { remultExpress } from 'remult/remult-express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(remultExpress({})) // [!code highlight]

  await app.listen(3000)
}
bootstrap()
```

```ts{9-17} [Koa]
import * as koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import { createRemultServer } from 'remult/server'

const app = new koa()

app.use(bodyParser())

const api = createRemultServer({})

app.use(async (ctx, next) => {
  const r = await api.handle(ctx.request)
  if (r) {
    ctx.response.body = r.data
    ctx.response.status = r.statusCode
  } else return await next()
})

app.listen(3000, () => {})
```

:::

## Connecting a Database

Use the `dataProvider` property of Remult's server middleware to set up a database connection for Remult.

::: tip Recommended - Use default local JSON files and connect a database later
If the `dataProvider` property is not set, Remult stores data as JSON files under the `./db` folder.
:::

Here are examples of connecting to some commonly used back-end databases:

::: tabs

== Postgres
Install node-postgres:

```sh
npm i pg
```

Set the `dataProvider` property:

```ts{3,7,11-15}
import express from "express"
import { remultExpress } from "remult/remult-express"
import { createPostgresDataProvider } from "remult/postgres"

const app = express()

const connectionString = "postgres://user:password@host:5432/database"

app.use(
  remultExpress({
    dataProvider:
      createPostgresDataProvider({
        connectionString, // default: process.env["DATABASE_URL"]
        // configuration: {} // optional = a `pg.PoolConfig` object or "heroku"
      })
  })
)
```

Or use your existing postgres connection

```ts
import { Pool } from 'pg'
import { SqlDatabase } from 'remult'
import { PostgresDataProvider } from 'remult/postgres'
import { remultExpress } from 'remult/remult-express'
const pg = new Pool({
  connectionString: '....',
})
const app = express()
app.use(
  remultExpress({
    dataProvider: new SqlDatabase(new PostgresDataProvider(pg)),
  }),
)
```

== MySQL

Install knex and mysql2:

```sh
npm i knex mysql2
```

Set the `dataProvider` property:

```ts{3,9-18}
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

Or use your existing knex provider

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultExpress } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: '...',
  connection: '...',
})

const app = express()

app.use(
  remultExpress({
    dataProvider: new KnexDataProvider(knexDb), // [!code highlight]
  }),
)
```

== MongoDB

Install mongodb:

```sh
npm i mongodb
```

Set the `dataProvider` property:

```ts{3-4,10-14}
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

== SQLite

There are several sqlite providers supported

### Better-sqlite3

Install better-sqlite3:

```sh
npm i better-sqlite3
```

Set the `dataProvider` property:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import Database from 'better-sqlite3' // [!code highlight]
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new BetterSqlite3DataProvider(new Database('./mydb.sqlite')), // [!code highlight]
    ), // [!code highlight]
  }),
)
```

### sqlite3

This version of sqlite3 works even on stackblitz

Install sqlite3:

```sh
npm i sqlite3
```

Set the `dataProvider` property:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import sqlite3 from 'sqlite3' // [!code highlight]
import { Sqlite3DataProvider } from 'remult/remult-sqlite3' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new Sqlite3DataProvider(new sqlite3.Database('./mydb.sqlite')), // [!code highlight]
    ), // [!code highlight]
  }),
)
```

### bun:sqlite

Set the `dataProvider` property:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import { Database } from 'bun:sqlite' // [!code highlight]
import { BunSqliteDataProvider } from 'remult/remult-bun-sqlite' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new BunSqliteDataProvider(new Database('./mydb.sqlite')), // [!code highlight]
    ), // [!code highlight]
  }),
)
```

### sql.js

Install sqlite3:

```sh
npm i sql.js
```

Set the `dataProvider` property:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import initSqlJs from 'sql.js' // [!code highlight]
import { SqlJsDataProvider } from 'remult/remult-sql-js' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())), // [!code highlight]
    ), // [!code highlight]
  }),
)
```

### Turso

Install turso:

```sh
npm install @libsql/client
```

Set the `dataProvider` property:

<!-- prettier-ignore-start -->
```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import { createClient } from '@libsql/client' // [!code highlight]
import { TursoDataProvider } from 'remult/remult-turso' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new TursoDataProvider( // [!code highlight]
        createClient({ // [!code highlight]
          url: process.env.TURSO_DATABASE_URL, // [!code highlight]
          authToken: process.env.TURSO_AUTH_TOKEN, // [!code highlight]
        }), // [!code highlight]
      ), // [!code highlight]
    ), // [!code highlight]
  }),
)
```
<!-- prettier-ignore-end -->

== Microsoft SQL Server

Install knex and tedious:

```sh
npm i knex tedious
```

Set the `dataProvider` property:

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

Or use your existing knex provider

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultExpress } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: '...',
  connection: '...',
})

const app = express()

app.use(
  remultExpress({
    dataProvider: new KnexDataProvider(knexDb), // [!code highlight]
  }),
)
```

== DuckDB
Install DuckDB:

```sh
npm i duckdb
```

Set the `dataProvider` property:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult' // [!code highlight]
import { Database } from 'duckdb' // [!code highlight]
import { DuckDBDataProvider } from 'remult/remult-duckdb' // [!code highlight]

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase( // [!code highlight]
      new DuckDBDataProvider(new Database(':memory:')), // [!code highlight]
    ), // [!code highlight]
  }),
)
```

== Oracle

Install knex and oracledb:

```sh
npm i knex oracledb
```

Set the `dataProvider` property:

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

Or use your existing knex provider

```ts
import express from 'express'
import { KnexDataProvider } from 'remult/remult-knex'
import { remultExpress } from 'remult/remult-express'
import knex from 'knex'

const knexDb = knex({
  client: '...',
  connection: '...',
})

const app = express()

app.use(
  remultExpress({
    dataProvider: new KnexDataProvider(knexDb), // [!code highlight]
  }),
)
```

== JSON Files

Set the `dataProvider` property:

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

:::

## Integrate Auth

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with a [`getUser`](./ref_remultserveroptions.md#getuser) function that extracts a user object (which implements the minimal Remult `UserInfo` interface) from a request.

Here are examples of integrating some commonly used auth providers:

::: code-group

```ts [express-session]
import express from 'express'
import session from 'express-session'
import { remultExpress } from 'remult/remult-express'

const app = express()

app.use(
  session({
    /* ... */
  }),
)

app.post('/api/signIn', (req, res) => {
  req.session!['user'] = { id: 1, name: 'admin', roles: ['admin'] }
})

app.use(
  remultExpress({
    getUser: (req) => req.session!['user'], // [!code highlight]
  }),
)
```

```ts{8-13} [next-auth]
// src/app/api/[...remult]/route.ts

import { remultNextApp } from 'remult/remult-next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export const api = remultNextApp({
  getUser: async () => {
    const user = (await getServerSession(authOptions))?.user
    return user?.email && user?.name
      ? { id: user?.email, name: user?.name }
      : undefined
  },
})

export const { POST, PUT, DELETE, GET, withRemult } = api
```

:::

## Defining and Serving an Entity

Remult entity classes are shared between frontend and backend code.

```ts
// shared/product.ts

import { Entity, Fields } from 'remult'

@Entity('products', {
  allowApiCrud: true,
  allowApiDelete: 'admin',
})
export class Product {
  @Fields.uuid()
  id!: string

  @Fields.string()
  name = ''

  @Fields.number()
  unitPrice = 0
}
```

Alternatively, [generate entities](./entities-codegen-from-db-schema.md) from an existing Postgres database.

### Serve Entity CRUD API

All Remult server middleware options contain an [`entities`](./ref_remultserveroptions.md#entities) array. Use it to register your Entity.

```ts
// backend/index.ts

app.use(
  remultExpress({
    entities: [Product], // [!code highlight]
  }),
)
```

## Using your Entity on the Client

To start querying and mutating data from the client-side using Remult, use the [`remult.repo`](./ref_remult.md#repo) function to create a [`Repository`](./ref_repository.md) object for your entity class. This approach simplifies data operations, allowing you to interact with your backend with the assurance of type safety.

```ts
// frontend/code.ts

import { remult } from 'remult'
import { Product } from '../shared/product'

const productsRepo = remult.repo(Product)

async function playWithRemult() {
  // add a new product to the backend database
  await productsRepo.insert({ name: 'Tofu', unitPrice: 5 })

  // fetch products from backend database
  const products = await productsRepo.find({
    where: { unitPrice: { '>=': 5 } },
    orderBy: { name: 'asc' },
    limit: 10,
  })
  console.log(products)

  // update product data
  const tofu = products.filter((p) => p.name === 'Tofu')
  await productsRepo.save({ ...tofu, unitPrice: tofu.unitPrice + 5 })

  // delete product
  await productsRepo.delete(tofu)
}

playWithRemult()
```

## Client-side Customization

::: tip Recommended Defaults
By default, remult uses the browser's [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), and makes data API calls using the base URL `/api` (same-origin).
:::

### Changing the default API base URL

To use a different origin or base URL for API calls, set the remult object's `apiClient.url` property.

```ts
remult.apiClient.url = 'http://localhost:3002/api'
```

### Using an alternative HTTP client

Set the `remult` object's `apiClient.httpClient` property to customize the HTTP client used by Remult:

::: code-group

```ts [Axios instead of Fetch]
import axios from 'axios'
import { remult } from 'remult'

remult.apiClient.httpClient = axios
```

```ts [Angular HttpClient instead of Fetch]
//...
import { HttpClientModule, HttpClient } from '@angular/common/http'
import { remult } from 'remult'

@NgModule({
  //...
  imports: [
    //...
    HttpClientModule,
  ],
})
export class AppModule {
  constructor(http: HttpClient) {
    remult.apiClient.httpClient = http
  }
}
```

:::
