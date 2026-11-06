import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  remult,
  repo,
} from '../../core'

@Entity('proxy-include-categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}

@Entity('proxy-include-tasks')
class Task {
  @Fields.integer()
  id = 0
  @Relations.toOne(() => Category)
  category?: Category
}

describe('include through the remult proxy', () => {
  beforeEach(async () => {
    remult.dataProvider = new InMemoryDataProvider()
    const category = await repo(Category).insert({ id: 1, name: 'cat1' })
    await repo(Task).insert({ id: 101, category })
  })
  const include = { category: true } as const
  it('find', async () => {
    const tasks = await repo(Task).find({ include })
    expectTypeOf(tasks[0].category).toEqualTypeOf<Category>()
    expect(tasks[0].category.name).toBe('cat1')
  })
  it('findFirst', async () => {
    const task = await repo(Task).findFirst({ id: 101 }, { include })
    expectTypeOf(task!.category).toEqualTypeOf<Category>()
    expect(task!.category.name).toBe('cat1')
  })
  it('findOne', async () => {
    const task = await repo(Task).findOne({ where: { id: 101 }, include })
    expectTypeOf(task!.category).toEqualTypeOf<Category>()
    expect(task!.category.name).toBe('cat1')
  })
  it('findId', async () => {
    const task = await repo(Task).findId(101, { include })
    expectTypeOf(task!.category).toEqualTypeOf<Category>()
    expect(task!.category.name).toBe('cat1')
  })
})
