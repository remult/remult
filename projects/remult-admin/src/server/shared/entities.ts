import { Fields, Relations } from '../../../../core/src/remult3/Fields'
import { Entity } from '../../../../core/src/remult3/entity'
import { Validators } from '../../../../core/src/validators'

@Entity('customers', {
  allowApiCrud: true,
})
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.string({
    validate: Validators.required,
  })
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany(() => Order, 'customer')
  orders?: Order[]
}
@Entity('orders', {
  allowApiCrud: true,
})
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.string()
  customer = ''
  @Relations.toOne(() => Customer, 'customer')
  customerEntity = ''
  @Fields.number()
  amount = 0
  @Fields.json()
  items = [{ id: 1, quantity: 5 }]
}

@Entity<OrderDetail>('order-details', {
  allowApiCrud: true,
  dbName: 'Order Details',
  id: { OrderID: true, ProductID: true },
})
export class OrderDetail {
  @Fields.string()
  OrderID!: string
  @Relations.toOne<OrderDetail, Order>(() => Order, 'OrderID')
  order?: Order

  @Fields.integer()
  ProductID!: number
  @Relations.toOne<OrderDetail, Product>(() => Product, 'ProductID')
  product?: Product

  @Fields.number()
  UnitPrice!: number

  @Fields.integer()
  Quantity = 1

  @Fields.integer()
  Discount = 0
}

@Entity<Product>('products', {
  allowApiCrud: true,
  dbName: 'Products',
  id: { ProductID: true },
})
export class Product {
  @Fields.integer()
  ProductID!: number

  @Fields.string()
  ProductName!: string

  @Fields.string()
  QuantityPerUnit = ''

  @Fields.number()
  UnitPrice!: number

  @Fields.integer()
  UnitsInStock = 0

  @Fields.integer()
  UnitsOnOrder = 0

  @Fields.integer()
  ReorderLevel = 0

  @Fields.boolean()
  Discontinued!: boolean

  @Relations.toMany<Product, OrderDetail>(() => OrderDetail, 'ProductID')
  orders?: OrderDetail[]
}
