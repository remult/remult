import { Entity, Fields } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}
