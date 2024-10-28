import { Entity, Fields, Relations, dbNamesOf } from 'remult'
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
  @Fields.string<Order>({
    sqlExpression: async () => {
      const orders = await dbNamesOf(Order, { tableName: true })
      const customer = await dbNamesOf(Customer)
      return `(select ${customer.city} 
                 from ${customer} 
                where ${customer.id} = ${orders.customerId})`
    },
  })
  customerCity = '' // Field pulling the city from the related Customer entity
}
