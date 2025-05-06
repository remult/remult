import express from 'express'
import { remultApi } from 'remult/remult-express'
import { entities, seed } from '../shared/model'

export const app = express()
export const api = remultApi({
  entities,
  admin: true,
  initApi: async () => {
    await seed()
  },
})

app.use(api)
