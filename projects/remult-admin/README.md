# remult-admin

A basic admin console to view [remult](https://remult.dev) entities.

![Admin](https://github.com/remult/remult/assets/16635859/067558d3-7587-4c24-ae84-38bbfe9390af)

Check it out live in the CRM demo:
https://crm-demo.up.railway.app/

sign in and select this menu
![image](https://github.com/remult/remult/assets/16635859/b6f1a409-1839-4fa1-b7d1-37aad4be7eee)

## Usage

Express example:

```ts
import express from 'express'
import { remultApi } from 'remult/remult-express'

const app = express()

const entities = [
  /* entity types */
]
const api = remultApi({
  entities,
  admin: true,
})
app.use(api)

app.listen(3000)
```
