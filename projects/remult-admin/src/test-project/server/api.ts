import { remultExpress } from 'remult/remult-express'
import { Customer, Order, OrderDetail, Product } from '../shared/entities'
import { repo } from 'remult'

export const entities = [Customer, Order, OrderDetail, Product]
export const api = remultExpress({
  entities,
})
