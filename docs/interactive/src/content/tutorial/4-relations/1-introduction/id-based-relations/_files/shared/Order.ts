import { Entity, Fields, Relations } from 'remult'
import { Customer } from './Customer'

@Entity('orders')
export class Order {
  @Fields.integer()
  id = 0
  @Fields.integer()
  customerId = 0 // Custom field to hold the related entity's identifier
  @Relations.toOne<Order, Customer>(() => Customer, 'customerId') // This establishes the relation
  customer!: Customer
  @Fields.number()
  amount = 0
}
