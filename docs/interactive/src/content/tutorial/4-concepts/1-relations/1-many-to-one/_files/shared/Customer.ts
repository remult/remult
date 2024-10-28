import { Entity, Fields, Relations } from 'remult'

@Entity('customers')
export class Customer {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
}
