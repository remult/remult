import { Entity, Fields, Relations } from 'remult'
import { Customer } from './Customer'
import { ProductInOrder } from './ProductInOrder'

@Entity('orders')
export class Order {
  @Fields.integer()
  id = 0
  @Fields.integer()
  customerId = 0
  @Relations.toOne<Order, Customer>(() => Customer, 'customerId')
  customer!: Customer
  @Fields.number()
  amount = 0
  @Relations.toMany<Order, ProductInOrder>(() => ProductInOrder, 'orderId')
  products?: ProductInOrder[]
}
