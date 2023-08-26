import { Remult } from '../context'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import {
  Field,
  Entity,
  EntityBase,
  rowHelperImplementation,
  EntityFilter,
  Fields,
  getEntityRef,
} from '../remult3'

import { entityFilterToJson, Filter } from '../filter/filter-interfaces'
import { Language } from './RowProvider.spec'


import { SqlDatabase } from '../data-providers/sql-database'

import { DataApi } from '../data-api'

import { actionInfo } from '../server-action'
import { Done } from './Done'
import { TestDataApiResponse } from './TestDataApiResponse'
import { h } from './h'

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