# remult-admin

A basic admin console to view [remult](https://remult.dev) entities.

[live demo](https://codesandbox.io/p/devbox/demo-remult-admin-rpfz72?file=%2Findex.ts)

## Usage

Express example:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import remultAdmin from 'remult-admin'

const app = express()

const entities = [
  /* entity types */
]
const api = remultExpress({
  entities,
})
app.use(api)

app.get('/admin/*', api.withRemult, (_, res) =>
  remult.isAllowed('admin')
    ? res.send(remultAdmin({ entities, baseUrl: '/admin' }))
    : res.send(404)
)

app.listen(3000)
```
