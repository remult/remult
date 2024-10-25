import { Entity, Fields, Relations, dbNamesOf } from 'remult'
import { sqlRelations } from 'remult/internals'
import { Order } from './Order'

@Entity('customers')
export class Customer {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany<Customer, Order>(() => Order, 'customerId')
  orders?: Order[]

  @Fields.integer({
    sqlExpression: () => sqlRelations(Customer).orders.$count(), // Count orders for each customer
  })
  orderCount = 0

  @Fields.integer({
    sqlExpression: () =>
      sqlRelations(Customer).orders.$count({
        amount: { $gt: 50 }, // Apply condition on amount field
      }),
  })
  bigOrderCount = 0

  @Fields.integer<Customer>({
    sqlExpression: () =>
      sqlRelations(Customer).orders.$subQuery((o) => `sum(${o.amount})`), // Aggregate sum of order amounts
  })
  totalAmount = 0
}
