import { Entity, Fields, Relations, dbNamesOf } from 'remult'
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

  @Fields.integer<Customer>({
    sqlExpression: async () => {
      const customer = await dbNamesOf(Customer, { tableName: true })
      const order = await dbNamesOf(Order)
      return `(select sum(${order.amount}) 
                 from ${order}
                where ${order.customerId} = ${customer.id})`
    },
  })
  totalAmount = 0 // Field showing the total order amount for each customer
}
