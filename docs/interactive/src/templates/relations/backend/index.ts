import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Customer } from './shared/Customer'
import { Order } from './shared/Order'
import { seedData } from './shared/SeedData'
import { InMemoryDataProvider } from 'remult'

export const app = express()
export const api = remultExpress({
  entities: [Order, Customer],
  admin: true,
  dataProvider: new InMemoryDataProvider(),
  initApi: async () => {
    await seedData()
  },
})

app.use(api)
