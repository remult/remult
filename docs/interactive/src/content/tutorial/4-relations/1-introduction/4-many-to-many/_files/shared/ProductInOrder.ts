import { Entity, Fields, Relations } from 'remult'
import { Product } from './Product'

@Entity<ProductInOrder>('ProductsInOrder', {
  allowApiCrud: true,

  id: ['orderId', 'productId'], // Composite Primary Key
})
export class ProductInOrder {
  @Fields.integer()
  orderId = 0
  @Fields.integer()
  productId = 0
  @Relations.toOne<ProductInOrder, Product>(() => Product, 'productId')
  product?: Product
}
