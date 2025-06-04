---
type: lesson
title: Rest Api
focus: /backend/index.ts
template: before-frontend
---

## The Rest Api

For this tutorial, we'll use Express (Remult works with many JavaScript web frameworks including Express, Fastify, Next.js, Sveltekit, nuxt.js, Hapi, Hono, Nest, and Koa).

Open `backend/index.ts` and add the following lines to include the `Task` in the REST API:

```ts title="backend/index.ts" add={2,3,6-9}
import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'

export const app = express()
export const api = remultApi({
  entities: [Task],
})
app.use(api)
```

### Code Explanation

- We import the necessary `remultApi` module for integrating Remult with Express.
- We import the `Task` entity from the `shared` folder.
- We use the `remultApi` function to set up the Remult REST API and register the `Task` entity in its `entities` array.
- Finally, we tell Express to use the API with `app.use(api)`.

### See that it works

Click on the `Test the Api` button in the preview window, you should see an empty JSON array in the result.

> You can also open the `network` tab in the developer tools and see the requests that are being sent to the nodejs server

:::tip
If you right click on the `preview` window, and select `inspect`, you'll be able to run the api call directly from the developer tools console (at least on chrome)

```js
await fetch('/api/tasks').then((result) => result.json())
```

:::
