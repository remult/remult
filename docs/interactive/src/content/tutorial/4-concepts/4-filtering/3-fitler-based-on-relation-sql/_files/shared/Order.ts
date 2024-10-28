import {
  Entity,
  Fields,
  Relations,
  Filter,
  dbNamesOf,
  SqlDatabase,
} from 'remult'
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
    async ({ city }) => {
      // Retrieve database column names with table prefixes
      const order = await dbNamesOf(Order, {
        tableName: true, // Use the table name as a prefix for column references
      })
      const customer = await dbNamesOf(Customer, {
        tableName: 'c', // Alias the customer table as 'c'
      })

      // Return a raw SQL filter to query the customer's city
      return SqlDatabase.rawFilter(
        ({ param }) =>
          `${order.customerId} in (select ${customer.id} from ${customer} as c
           where ${customer.city} like ${param('%' + city + '%')})`,
      )
    },
  )
}
