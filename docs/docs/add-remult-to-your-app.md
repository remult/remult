---
outline: [2, 3]
---

# Add Remult to your App

::: tip New Project?

We suggest using one of the [tutorials](../docs/#learn-by-doing) to have a fresh good start.
:::

::: tip Add to your existing project?

You are at the right place, Remult is designed to be added to existing projects.

Embark on the Remult journey at your own pace and start reaping the benefits from day one. Gradual adoption is the preferred route for many, allowing for a smooth integration into your workflow.
:::

## Installation

**The _remult_ package is one and the same for both the frontend bundle and the backend server.**

If you're using one `package.json` for both frontend and backend (or a meta-framework such as Next.js) - **install Remult once** in the project's root folder.

If you're using multiple `package.json` files (monorepo) - **install Remult in both server and client folders**.

```sh
npm install remult
```

## Server-side Initialization

Remult is initialized on the server-side as a request handling middleware, with **a single line of code**.

Here is the code for setting up the Remult middleware:

### Express

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'

const app = express()

app.use(
  remultExpress({
    entities: [
      /* entity types */
    ],
  }),
)

app.listen(3000)
```

### Fastify

```ts
import fastify from 'fastify'
import { remultFastify } from 'remult/remult-fastify'
;(async () => {
  const server = fastify()

  await server.register(
    remultFastify({
      entities: [
        /* entity types */
      ],
    }),
  )

  server.listen({ port: 3000 })
})()
```

### Next.js Pages Router

```ts
// src/pages/api/[...remult].ts

import { remultNext } from 'remult/remult-next'

export default remultNext({
  entities: [
    /* entity types */
  ],
})
```

### Next.js App Router

```ts
// src/api.ts

import { remultNextApp } from 'remult/remult-next'

export const api = remultNextApp({
  entities: [
    /* entity types */
  ],
})

// src/app/api/[...remult]/route.ts

import { api } from '../../../api'

export const { POST, PUT, DELETE, GET } = api
```

### Sveltekit

```ts
// src/hooks.server.ts

import { remultSveltekit } from 'remult/remult-sveltekit'

export const handle = remultSveltekit({
  entities: [
    /* entity types */
  ],
})
```

### Hapi

```ts
import { type Plugin, server } from '@hapi/hapi'
import { remultHapi } from 'remult/remult-hapi'
;(async () => {
  const hapi = server({ port: 3000 })

  await hapi.register(
    remultHapi({
      entities: [
        /* entity types */
      ],
    }),
  )

  hapi.start()
})()
```

### Nest

```ts
// src/main.ts

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { remultExpress } from 'remult/remult-express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(
    remultExpress({
      entities: [
        /* entity types */
      ],
    }),
  )

  await app.listen(3000)
}
bootstrap()
```

### Koa

```ts
import * as koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import { createRemultServer } from 'remult/server'

const app = new koa()

app.use(bodyParser())

const api = createRemultServer({
  entities: [
    /* entity types */
  ],
})

app.use(async (ctx, next) => {
  const r = await api.handle(ctx.request)
  if (r) {
    ctx.response.body = r.data
    ctx.response.status = r.statusCode
  } else return await next()
})

app.listen(3000, () => {})
```

## Client-side Initialization

On the client side, `remult` can use any standard javascript HTTP-client to call the data API.

**By default, remult uses the browser's `fetch` API, and makes data API calls using the base URL `/api` (same-origin).**

Here is the code for setting up a Remult client instance:

### Using Fetch

```ts
import { remult } from 'remult'
```

### Using Axios

```ts
import axios from 'axios'
import { remult } from 'remult'

remult.apiClient.httpClient = axios
```

### Using Angular HttpClient

```ts
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

### Changing the default API base URL

By default, remult makes data API calls to routes based at the `/api` route of the origin of the client-side app. (e.g. `https://localhost:3000/api`)

To use a different base URL for API calls (e.g. `https://localhost:3002/api`), set the remult object's `apiClient.url` property.

```ts
remult.apiClient.url = 'http://localhost:3002/api'
```

::: warning CORS
Handling [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is outside the scope of Remult.
:::

## Database Initialization

Got a database ready? Fantastic! Unleash the full potential of your existing setup by generating your entities directly from the database itself.

Check out [remult-cli](../docs/entities-codegen-from-db-schema.html) and see how it can one shot generate your entities in no time.
