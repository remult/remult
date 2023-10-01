import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  FindFirstOptions,
  FindOptions,
  InMemoryDataProvider,
  Remult,
} from '../../../core'
import type { ClassType } from '../../../core/classType'

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.reference(() => Category, { defaultIncluded: true })
  pCategory: Category
  @Fields.integer()
  secondCategoryId = 0
  @Fields.one<Category, Category>(() => Category, {
    field: 'secondCategoryId',
    defaultIncluded: true,
  })
  secondCategory: Category
}

describe('test repository relations', () => {
  let remult: Remult
  function r<entityType>(entity: ClassType<entityType>) {
    return remult.repo(entity)
  }
  it('test that it works', async () => {
    remult = new Remult(new InMemoryDataProvider())
    let c = await r(Category).insert({
      id: 1,
      name: 'cat1',
    })
    await r(Category).update(c, { pCategory: c, secondCategoryId: c.id })
    remult.clearAllCache()
    c = await r(Category).findFirst()
    expect(c.pCategory.pCategory.id).toBe(1)
    expect(c.secondCategory.secondCategory.id).toBe(1)
  })
})
