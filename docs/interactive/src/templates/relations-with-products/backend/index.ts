import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Customer } from './shared/Customer'
import { Order } from './shared/Order'
import { seedData } from './shared/SeedData'
import { InMemoryDataProvider, repo } from 'remult'
import { Product } from '../shared/Product'
import { ProductInOrder } from '../shared/ProductInOrder'

export const app = express()
export const api = remultApi({
  entities: [Order, Customer, Product, ProductInOrder],
  dataProvider: new InMemoryDataProvider(),
  initApi: async () => {
    seedData()
  },
  admin: true,
})

app.use(api)
