import { Entity, Fields, Relations } from 'remult'
import { Order } from './Order'

@Entity('customers')
export class Customer {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany<Customer, Order>(() => Order, 'customerId') // This establishes the relation
  orders?: Order[]
}
