import { Entity, EntityBase, Field, Fields } from '../../core/src/remult3'

import { Language } from './RowProvider.spec'

@Entity('categories')
export class Categories extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.string()
  name: string
  @Field(() => Language)
  language: Language
  @Fields.boolean()
  archive: boolean = false
}
@Entity('suppliers')
export class Suppliers extends EntityBase {
  @Fields.string()
  supplierId: string
  @Fields.string()
  name: string
}
@Entity('products')
export class Products extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.string()
  name: string
  @Field(() => Categories, {
    lazy: true,
  })
  category: Categories
  @Field(() => Suppliers)
  supplier: Suppliers
}
@Entity<CompoundIdEntity>('compountIdEntity', {
  id: (x) => [x.a, x.b],
})
export class CompoundIdEntity extends EntityBase {
  @Fields.integer()
  a: number
  @Fields.integer()
  b: number
  @Fields.integer()
  c: number
}
