import { describe, expect, it } from 'vitest'

import {
  type ContainsStringValueFilter,
  IdEntity,
  remult,
  Entity,
  Fields,
  Field,
  Remult,
  InMemoryDataProvider,
  EntityBase,
} from '../../core'
import type { ClassType } from '../../core/classType'

@Entity('helperBase')
class HelpersBase extends EntityBase {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}
@Entity('familyDeliveries')
class FamilyDeliveries extends EntityBase {
  @Fields.integer()
  id = 0
  @Field(() => HelpersBase)
  courier: HelpersBase
}

@Entity('helper', {
  dbName: 'helperBase',
})
class Helpers extends HelpersBase {
  @Fields.string()
  phone = ''
}

it('type inheritance works', async () => {
  const remult = new Remult(new InMemoryDataProvider())
  function repo<T>(x: ClassType<T>) {
    return remult.repo(x)
  }
  const [h1, h2] = await repo(Helpers).insert([{ id: 1 }, { id: 2 }])
  await repo(FamilyDeliveries).insert({ id: 1, courier: h1 })
  expect(
    await repo(FamilyDeliveries).count({
      courier: h1,
    }),
  ).toBe(1)
  expect(
    await repo(FamilyDeliveries).count({
      courier: h2,
    }),
  ).toBe(0)
})
