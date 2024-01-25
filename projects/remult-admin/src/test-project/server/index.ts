import express from 'express'
import { api, entities } from './api'

import { buildEntityInfo } from '../../lib'

export const app = express()
app.use(api)
app.get('/api/dev-admin', api.withRemult, (req, res) => {
  res.json(buildEntityInfo({ entities }))
})

//import getEntityBrowserHtml from "../../../dist/index"
// app.get("/admin", (req, res) => {
//   res.send(getEntityBrowserHtml([Customer, Order]))
// })
