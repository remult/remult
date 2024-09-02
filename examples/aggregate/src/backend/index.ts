import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { entities, seed } from '../shared/model'

export const app = express()
export const api = remultExpress({
  entities,
  admin: true,
  initApi: async () => {
    await seed()
  },
})

app.use(api)
