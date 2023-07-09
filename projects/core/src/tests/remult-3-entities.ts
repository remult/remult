import { EntityBase, Field, Entity, Repository, Fields } from '../remult3'
import { Status } from './testModel/models'

@Entity('Products')
export class Products {
  @Fields.integer()
  id: number
  @Fields.string()
  name: string
  @Fields.number()
  price: number
  @Fields.boolean()
  archived: boolean
  @Fields.date()
  availableFrom: Date
}

export interface CategoriesForTesting extends EntityBase {
  id: number
  categoryName: string
  description: string
  status: Status
}
let r: Repository<CategoriesForTesting>

@Entity('Categories', {
  allowApiCrud: true,
})
export class Categories extends EntityBase {
  @Fields.number({
    dbName: 'CategoryID',
  })
  id: number = 0
  @Fields.string({ allowNull: true })
  categoryName: string
  @Fields.string()
  description: string
  @Fields.number<Categories>({
    serverExpression: (c) =>
      c.categoryName ? c.categoryName.length : undefined,
  })
  categoryNameLength: number
  @Fields.number<Categories>({
    serverExpression: (c) =>
      Promise.resolve(c.categoryName ? c.categoryName.length : undefined),
  })
  categoryNameLengthAsync: number
  @Field(() => Status)
  status: Status
}
