---
type: lesson
title: Rest Api
focus: /backend/index.ts
template: before-frontend
---

## The Rest Api

For this tutorial, we'll use Express (Remult works with many JavaScript web frameworks including Express, Fastify, Next.js, Sveltekit, nuxt.js, Hapi, Hono, Nest, and Koa).

Open `backend/index.ts` and add the following lines to include the `Task` in the REST API:

```ts add={2,3,6-9}
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task.js'

export const app = express()
export const api = remultExpress({
  entities: [Task],
})
app.use(api)
```

### Code Explanation

- We import the necessary modules: `express` for creating the server and `remultExpress` for integrating Remult with Express.
- We import the `Task` entity from the `shared` folder.
- We use the `remultExpress` function to set up the Remult REST API and register the `Task` entity in its `entities` array.
- Finally, we tell Express to use the API with `app.use(api)`.

### See that it works

Click on the `Test the Api` button in the preview window, you should see an empty JSON array in the result.
