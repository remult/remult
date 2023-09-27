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

@Entity('company')
class Company {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.toOne(Category, () => Company, {
    defaultIncluded: true,
  })
  company: Company

  @Fields.integer()
  secondCompanyId = 0
  @Fields.toOne(Category, () => Company, {
    field: 'secondCompanyId',
    defaultIncluded: true,
  })
  secondCompany: Company
  @Fields.toMany(Category, () => Task, {
    field: 'category',
    defaultIncluded: true,
  })
  tasks: Task[]
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.boolean()
  completed = false
  @Fields.toOne(Task, () => Category)
  category!: Category
}
describe('test repository relations', () => {
  let remult: Remult
  function r<entityType>(entity: ClassType<entityType>) {
    return remult.repo(entity)
  }
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const c = await r(Category).insert({
      id: 1,
      name: 'cat1',
      company: await r(Company).insert({ id: 11, name: 'comp1' }),
      secondCompanyId: (await r(Company).insert({ id: 12, name: 'comp2' })).id,
    })
    await r(Task).insert({ id: 101, title: 'task1', category: c })
    remult.clearAllCache()
  })
  it.skip('loads', async () => {
    const c = await r(Category).findFirst()
    expect(c.company.id).toBe(11)
    expect(c.secondCompany.name).toBe('comp2')
    expect(c.tasks.length).toBe(1)
  })
  it("doesn't loads", async () => {
    const c = await r(Category).findFirst({}, { include: {} })
    expect(c.company).toBeUndefined()
    expect(c.secondCompany).toBeUndefined()
    expect(c.tasks).toBeUndefined()
  })
})
