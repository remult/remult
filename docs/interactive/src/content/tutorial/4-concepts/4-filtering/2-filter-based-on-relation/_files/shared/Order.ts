import { Entity, Fields, Relations, Filter, repo } from 'remult'
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

  // Custom filter definition
  static fromCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      // Retrieve customers from the specified city
      const customers = await repo(Customer).find({
        where: { city: { $contains: city } },
      })

      // Return a filter based on the customerId field
      return {
        customerId: customers.map((c) => c.id),
      }
    },
  )
}
