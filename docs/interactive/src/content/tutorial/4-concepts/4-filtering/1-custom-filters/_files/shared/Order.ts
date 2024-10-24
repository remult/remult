import { Entity, Fields, Relations, Filter } from 'remult'
import { Customer } from './Customer'
import { OrderStatuses, type OrderStatus } from './OrderStatus'

@Entity<Order>('orders', {
  defaultOrderBy: {
    orderDate: 'asc',
  },
})
export class Order {
  @Fields.integer()
  id = 0
  @Fields.dateOnly()
  orderDate = new Date()
  @Fields.literal(() => OrderStatuses)
  status: OrderStatus = 'created'
  @Fields.integer()
  customerId = 0
  @Relations.toOne<Order, Customer>(() => Customer, 'customerId')
  customer!: Customer
  @Fields.number()
  amount = 0

  // Add custom filter here
}
