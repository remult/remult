import { Entity, Fields, Relations } from 'remult'
import { Customer } from './Customer'

@Entity('orders')
export class Order {
  @Fields.integer()
  id = 0
  @Relations.toOne(() => Customer) // This establishes the relation
  customer?: Customer
  @Fields.number()
  amount = 0
}
