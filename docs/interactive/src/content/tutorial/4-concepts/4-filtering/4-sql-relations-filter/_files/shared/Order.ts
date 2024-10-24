import { Entity, Fields, Relations, Filter } from 'remult'
import { sqlRelationsFilter } from 'remult/internals'
import { Customer } from './Customer'

@Entity<Order>('orders', {
  defaultOrderBy: {
    orderDate: 'asc',
  },
})
export class Order {
  @Fields.integer()
  id = 0

  @Fields.integer()
  customerId = 0

  @Relations.toOne<Order, Customer>(() => Customer, 'customerId')
  customer!: Customer

  @Fields.number()
  amount = 0

  // SQL-based custom filter for filtering orders by customer's city
  static fromCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) =>
      sqlRelationsFilter(Order).customer.some({
        city: {
          $contains: city,
        },
      }),
  )
}
