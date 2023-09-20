import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  FindFirstOptions,
  FindOptions,
  InMemoryDataProvider,
  Remult,
} from '../../core'
import type { ClassType } from '../../core/classType'
import { TestDataProvider } from '../dbs/TestDataProviderWithStats'

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.toMany(Category, () => Task, 'category')
  tasks: Task[]
  @Fields.toMany(Category, () => Task, 'secondaryCategoryId')
  taskSecondary: Task[]
  @Fields.toMany(Category, () => Task, {
    match: 'secondaryCategoryId',
    limit: 2,
  })
  taskSecondary1: Task[]
  @Fields.toMany(Category, () => Task, {
    match: [['id', 'secondaryCategoryId']],
    limit: 2,
    include: {
      category: true,
      secondaryCategory: {
        include: {
          tasks: true,
        },
      },
    },
    where: {
      completed: true,
    },
    orderBy: {
      id: 'desc',
    },
  })
  taskSecondary2: Task[]
  @Fields.toMany(Category, () => Task, {
    findOptions: (category) => ({
      limit: 2,
      where: {
        $or: [
          {
            category: { $id: category.id },
          },
          {
            secondaryCategoryId: category.id,
          },
        ],
      },
    }),
  })
  allTasks: Task[]
  @Fields.toOne(Category, () => Task, {
    findOptions: (category) => ({
      where: {
        $or: [
          {
            category: { $id: category.id },
          },
          {
            secondaryCategoryId: category.id,
          },
        ],
      },
    }),
  })
  firstTask: Task
  @Fields.date()
  createdAt = new Date(1976, 5, 16)
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.toOne(Task, () => Category)
  category!: Category
  @Fields.boolean()
  completed = false

  @Fields.integer()
  secondaryCategoryId = 0
  @Fields.toOne(Task, () => Category, 'secondaryCategoryId')
  secondaryCategory!: Category
  @Fields.toOne(Task, () => Category, {
    match: 'secondaryCategoryId',
  })
  secondaryCategory1!: Category
  @Fields.toOne(Task, () => Category, {
    match: ['secondaryCategoryId', 'id'],
  })
  secondaryCategory2!: Category
}

describe('test relations', () => {
  let remult: Remult
  function r<entityType>(entity: ClassType<entityType>) {
    return remult.repo(entity)
  }
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const c = await r(Category).insert([
      { id: 1, name: 'c1' },
      { id: 2, name: 'c2' },
      { id: 3, name: 'c3' },
    ])
    await r(Task).insert([
      { id: 1, title: 't1', category: c[0], secondaryCategoryId: 3 },
      { id: 2, title: 't2', category: c[0], secondaryCategoryId: 3 },
      {
        id: 3,
        title: 't3',
        category: c[0],
        secondaryCategoryId: 3,
        completed: true,
      },
      { id: 4, title: 't4', category: c[1], secondaryCategoryId: 2 },
    ])
    remult.clearAllCache()
  })
  it('no extra data is loaded', async () => {
    let stats = (remult.dataProvider = TestDataProvider(remult.dataProvider))
    const t = await r(Task).findFirst({ id: 4 })
    expect(t.category).toBeUndefined()
    await new Promise((res) => setTimeout(res, 10))
    expect(stats.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "tasks",
          "where": {
            "id": 4,
          },
        },
      ]
    `)
  })
  it('loads on demand', async () => {
    const t = await r(Task).findFirst(
      { id: 1 },
      {
        include: {
          category: true,
        },
      },
    )
    expect(t.category).toMatchInlineSnapshot(`
      Category {
        "allTasks": undefined,
        "createdAt": 1976-06-15T22:00:00.000Z,
        "firstTask": undefined,
        "id": 1,
        "name": "c1",
        "taskSecondary": undefined,
        "taskSecondary1": undefined,
        "taskSecondary2": undefined,
        "tasks": undefined,
      }
    `)
  })
})
