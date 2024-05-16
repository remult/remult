---
keywords:
  [
    Error: remult object was requested outside of a valid context,
    try running it within initApi or a remult request cycle,
  ]
---

# Using Remult in Non-Remult Routes

When using the CRUD api or [BackendMethods](./backendMethods.md), `remult` is automatically available. Still, there are many use cases where you may want to user remult in your own routes or other code without using `BackendMethods` but would still want to take advantage of `Remult` as an ORM and use it to check for user validity, etc...

If you tried to use the `remult` object, you may have got the error:

## Error: remult object was requested outside of a valid context, try running it within initApi or a remult request cycle <!-- I've placed this as header for search-->

Here's how you can use remult in this context, according to the server you're using:

::: tabs
== Express

### withRemult middleware

You can use remult as an express middleware for a specific route, using `api.withRemult`

```ts{1}
app.post('/api/customSetAll', api.withRemult, async (req, res) => {
  // ....
})
```

Or as an express middleware for multiple routes

```ts
app.use(api.withRemult) // [!code highlight]
app.post('/api/customSetAll', async (req, res) => {
  // ....
})
```

### withRemultAsync promise wrapper

Use the `api.withRemultAsync` method in promises

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'

const app = express();
...
const api = remultExpress({
  entities:[Task]
})
app.post('/api/customSetAll', async (req, res) => {
  // use remult in a specific piece of code // [!code highlight]
  await api.withRemultAsync(req, async ()=> { // [!code highlight]
    if (!remult.authenticated()) {
      res.sendStatus(403);
      return;
    }
    if (!remult.isAllowed("admin")) {
      res.sendStatus(403);
      return;
    }
    const taskRepo = remult.repo(Task);
    for (const task of await taskRepo.find()) {
      task.completed = req.body.completed;
      await taskRepo.save(task);
    }
    res.send();
  })
});
```

You can also use it without sending the request object, for non request related code

```ts{2}
setInterval(async () => {
  api.withRemultAsync(undefined, async () => {
    // ....
  })
}, 10000)
```

== Fastify

<!-- prettier-ignore-start -->
```ts 
import fastify from 'fastify'
import { remultFastify } from 'remult/remult-fastify'

(async () => {
  const server = fastify()

  await server.register(remultFastify({})) // [!code highlight]
  server.get('/api/test', async (req, res) => {
    return {
      result: await api.withRemult(req, () => remult.repo(Task).count()), // [!code highlight]
    }
  })


  server.listen({ port: 3000 })
})()
```

<!-- prettier-ignore-end -->

== Hono

<!-- prettier-ignore-start -->
```ts 
import { Hono } from 'hono'
import { remultHono } from 'remult/remult-hono'

const app = new Hono()

const api = remultHono({}) 
app.get('/test1', api.withRemult, async (c) => // [!code highlight]
  c.text('hello ' + (await repo(Task).count())),
)
app.route('', api)

export default app
```

== Next.js app router

```ts
// src/app/api/test/route.ts

import { NextResponse } from 'next/server'
import { repo } from 'remult'
import { Task } from '../../../shared/task'
import { api } from '../../../api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return api.withRemult(async () => {
    return NextResponse.json({
      result: repo(Task).count(),
      user: remult.user,
    })
  })
}
```

== Sveltekit

You can use the `withRemult` method in specific routes

```ts
// src/routes/api/test/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit'
import { remult } from 'remult'
import { Task } from '../../../shared/Task'
import { _api } from '../[...remult]/+server'

export const GET: RequestHandler = async (event) => {
  return _api.withRemult(event, async () =>
    json({ result: await remult.repo(Task).count() }),
  )
}
```

You can also define the withRemult as a hook, to make remult available throughout the application

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { _api } from './routes/api/[...remult]/+server'

/**
 * Handle remult server side
 */
const handleRemult: Handle = async ({ event, resolve }) => {
  return await _api.withRemult(event, async () => await resolve(event))
}

export const handle = sequence(
  // Handle remult server side
  handleRemult,
)
```

<!-- prettier-ignore-start -->

== SolidStart

You can use the `withRemult` method in specific routes

```ts
// src/routes/api/test.ts

import { remult } from 'remult'
import { Task } from '../../../shared/Task'
import { _api } from '../[...remult]/+server'

export function GET() {
  return api.withRemult(event, async () =>
    ({ result: await remult.repo(Task).count() }),
  )
}
```

You can also use the same method for any "use server" function
```ts
export function getCount(){
  return api.withRemult(event, async () =>
   ({ result: await remult.repo(Task).count() }),
  )
}
```

You can also define the withRemult as a hook, to make remult available throughout the application

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { _api } from './routes/api/[...remult]/+server'

/**
 * Handle remult server side
 */
const handleRemult: Handle = async ({ event, resolve }) => {
  return await _api.withRemult(event, async () => await resolve(event))
}

export const handle = sequence(
  // Handle remult server side
  handleRemult,
)
```

<!-- prettier-ignore-start -->

== Hapi
```ts 
import { type Plugin, server } from '@hapi/hapi'
import { remultHapi } from 'remult/remult-hapi'

(async () => {
  const hapi = server({ port: 3000 })
  const api = remultHapi({})
  await hapi.register(api) // [!code highlight]

  server.route({
    method: 'GET',
    path: '/api/test2',
    handler: async (request, h) => {
      return api.withRemult(request, async () => {
        return {
          result: await remult.repo(Task).count(),
        }
      })
    },
  })

  hapi.start()
})()
```
<!-- prettier-ignore-end -->

:::
