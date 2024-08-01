import { beforeEach, describe, expect, it } from 'vitest'
import type {
  DataProvider,
  EntityDataProvider,
  EntityMetadata,
} from '../../core'
import {
  Entity,
  Field,
  Fields,
  InMemoryDataProvider,
  Remult,
  describeClass,
  remult,
} from '../../core'
import { TestDataProvider } from './TestDataProviderWithStats'

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  categoryName = ''
}
@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
}
@Entity<TasksToCategories>('tasksToCategories', {
  id: { task: true, category: true }, // (e) => [e.task, e.category],
})
class TasksToCategories {
  @Field(() => Task, { lazy: true })
  task!: Task
  @Field(() => Category, { lazy: true })
  category!: Category
}
@Entity('extraTask')
class ExtraTaskInfo {
  @Field(() => Task, { lazy: true })
  id!: Task
  @Fields.string()
  whatever = ''
}

describe('test lazy loading timing', () => {
  const remult = new Remult()
  let stats: TestDataProvider
  beforeEach(() => {
    stats = remult.dataProvider = TestDataProvider(new InMemoryDataProvider())
  })
  it('test many to many table with id based on relations', async () => {
    await remult.repo(TasksToCategories).insert({
      task: await remult.repo(Task).insert({
        id: 1,
        title: 'noam',
      }),
      category: await remult
        .repo(Category)
        .insert({ id: 1, categoryName: 'cat1' }),
    })
    remult.clearAllCache()
    await remult.repo(TasksToCategories).find()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(stats.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "tasksToCategories",
          "where": {},
        },
      ]
    `)
  })
  it('test table with id based on a many to one', async () => {
    await remult.repo(ExtraTaskInfo).insert({
      id: await remult.repo(Task).insert({
        id: 1,
        title: 'noam',
      }),
    })
    remult.clearAllCache()
    await remult.repo(ExtraTaskInfo).find()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(stats.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "extraTask",
          "where": {},
        },
      ]
    `)
  })
  it('test to json', async () => {
    await remult.repo(ExtraTaskInfo).insert({
      id: await remult.repo(Task).insert({
        id: 1,
        title: 'noam',
      }),
    })
    remult.clearAllCache()
    const json = remult
      .repo(ExtraTaskInfo)
      .toJson(await remult.repo(ExtraTaskInfo).find())
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(stats.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "extraTask",
          "where": {},
        },
      ]
    `)
    expect(json).toMatchInlineSnapshot(`
      [
        {
          "id": undefined,
          "whatever": "",
        },
      ]
    `)
  })
})
