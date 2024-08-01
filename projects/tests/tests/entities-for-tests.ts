import {
  Entity,
  EntityBase,
  Field,
  Fields,
  ValueListFieldType,
} from '../../core'
import { createData } from './createData.js'

@Entity('categories')
export class Categories extends EntityBase {
  @Fields.integer()
  id!: number
  @Fields.string()
  name!: string
  @Field(() => Language)
  language!: Language
  @Fields.boolean()
  archive: boolean = false
}
@Entity('suppliers')
export class Suppliers extends EntityBase {
  @Fields.string()
  supplierId!: string
  @Fields.string()
  name!: string
}
@Entity('products')
export class Products extends EntityBase {
  @Fields.integer()
  id!: number
  @Fields.string()
  name!: string
  @Field(() => Categories, {
    lazy: true,
  })
  category!: Categories
  @Field(() => Suppliers)
  supplier!: Suppliers
}
@Entity<CompoundIdEntity>('compountIdEntity', {
  id: (x) => [x.a, x.b],
})
export class CompoundIdEntity extends EntityBase {
  @Fields.integer()
  a!: number
  @Fields.integer()
  b!: number
  @Fields.integer()
  c!: number
}

@ValueListFieldType({
  getValues: () => [
    Language.Hebrew,
    Language.Russian,
    new Language(20, 'אמהרית'),
  ],
})
export class Language {
  static Hebrew = new Language(0, 'עברית')
  static Russian = new Language(10, 'רוסית')
  constructor(
    public id: number,
    public caption: string,
  ) {}
}

export async function insertFourRows() {
  return createData(async (i) => {
    await i(1, 'noam', 'x')
    await i(4, 'yael', 'x')
    await i(2, 'yoni', 'y')
    await i(3, 'maayan', 'y')
  })
}
