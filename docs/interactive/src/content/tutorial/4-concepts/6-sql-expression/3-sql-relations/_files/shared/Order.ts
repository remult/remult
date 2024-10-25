import { Entity, Fields, Relations, dbNamesOf } from 'remult'
import { sqlRelations } from 'remult/internals'
import { Customer } from './Customer'

@Entity('orders')
export class Order {
  @Fields.integer()
  id = 0
  @Fields.integer()
  customerId = 0
  @Relations.toOne<Order, Customer>(() => Customer, 'customerId') // This establishes the relation
  customer!: Customer
  @Fields.number()
  amount = 0

  @Fields.string({
    sqlExpression: () => sqlRelations(Order).customer.city, // Retrieve the customer's city directly
  })
  customerCity = ''
}
