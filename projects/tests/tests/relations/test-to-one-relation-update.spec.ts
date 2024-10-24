import { it, expect, describe, beforeAll } from 'vitest'
import {
  Entity,
  EntityBase,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
} from '../../../core'

describe('relations to one behavior', () => {
  @Entity('category')
  class Category extends EntityBase {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
    @Relations.toMany(() => Task, 'categoryId')
    tasks?: Task[]
  }
  @Entity('task')
  class Task extends EntityBase {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
    @Fields.integer()
    categoryId = 0
    @Relations.toOne(() => Category, 'categoryId')
    category?: Category
    @Relations.toOne(() => Category)
    cat2?: Category
  }
  let remult = new Remult()
  function r<T>(e: new () => T) {
    return remult.repo(e)
  }
  beforeAll(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const cat2 = await r(Category).insert({ id: 1, title: 'category 1' })
    await r(Task).insert({ id: 1, title: 'task 1', categoryId: 1, cat2 })
  })
  it("update of relation shouldn't behave as change toOne", async () => {
    const task = await r(Task).findFirst({}, { include: { category: true } })
    expect(task!._.wasChanged()).toBe(false)
  })
  it("update of relation shouldn't behave as change toRef", async () => {
    const task = await r(Task).findFirst({}, { include: { cat2: true } })
    expect(task!._.wasChanged()).toBe(false)
  })
  it("update of relation shouldn't behave as change toMany", async () => {
    const c = await r(Category).findFirst({}, { include: { tasks: true } })
    expect(c!._.wasChanged()).toBe(false)
  })
  it('test missing value', async () => {
    await r(Task).update(1, { categoryId: 2 })
    const task = await r(Task).findFirst({}, { include: { category: true } })
    expect(task!.categoryId).toBe(2)
  })
  it('verify that save does not load relations for no reason', async () => {
    const task = await r(Task).findFirst({})
    expect(task).toMatchInlineSnapshot(`
      Task {
        "categoryId": 2,
        "id": 1,
        "title": "task 1",
      }
    `)
    task!.title += '2'
    await task!.save()
    expect(task).toMatchInlineSnapshot(`
      Task {
        "categoryId": 2,
        "id": 1,
        "title": "task 12",
      }
    `)
  })
})
