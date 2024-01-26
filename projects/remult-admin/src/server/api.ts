import { Customer, Order, OrderDetail, Product } from './shared/entities'
import { remultExpress } from '../../../core/remult-express'

export const entities = [Customer, Order, OrderDetail, Product]
export const api = remultExpress({
  entities,
  admin: true,
})
