import express from 'express'
import { api, entities } from './api'
import remultAdminHtml, {
  buildEntityInfo,
} from '../../../core/server/remult-admin'
import { Customer, Order } from './shared/entities'

export const app = express()
app.use(api)
app.get('/api/dev-admin', api.withRemult, (req, res) => {
  res.json(buildEntityInfo({ entities }))
})

app.get('/api/\\$admin*', api.withRemult, (req, res) => {
  console.log('made it here')
  res.send(
    remultAdminHtml({ entities: [Customer, Order], baseUrl: '/api/$admin' }),
  )
})
