import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
} from '../../core'

@Entity('select-off-categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Relations.toMany<Category, Task>(() => Task, 'categoryId')
  tasks?: Task[]
}

@Entity('select-off-tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.integer()
  categoryId = 0
  @Relations.toOne<Task, Category>(() => Category, 'categoryId')
  category?: Category
}

describe('select without typedSelect', () => {
  let remult: Remult
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    await remult.repo(Category).insert({ id: 1, name: 'cat1' })
    await remult.repo(Task).insert({ id: 101, title: 'task1', categoryId: 1 })
  })
  it('select keeps every member and include still loads', async () => {
    const task = await remult.repo(Task).findOne({
      select: { title: true, categoryId: true },
      include: { category: true },
    })
    expectTypeOf(task!.id).toEqualTypeOf<number>()
    expectTypeOf(task!.category).toEqualTypeOf<Category>()
    expect(task!.category.name).toBe('cat1')
  })
  it('select inside include keeps the relation type', async () => {
    const category = await remult.repo(Category).findId(1, {
      include: { tasks: { select: { title: true } } },
    })
    expectTypeOf(category!.tasks).toEqualTypeOf<Task[]>()
    expect(category!.tasks.map((t) => t.title)).toEqual(['task1'])
  })
})
