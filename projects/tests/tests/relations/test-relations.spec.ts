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
import { TestDataProvider } from '../../dbs/TestDataProviderWithStats'
import {
  findOptionsFromJson,
  findOptionsToJson,
} from '../../../core/src/data-providers/rest-data-provider'

@Entity('company')
class Company {
  @Fields.integer()
  id = 0
  @Fields.string()
  companyName = ''
}

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Fields.many(() => Task, 'category')
  tasks: Task[]
  @Fields.many(() => Task, 'secondaryCategoryId')
  tasksSecondary: Task[]
  @Fields.many(() => Task, {
    field: 'secondaryCategoryId',
    findOptions: {
      limit: 2,
    },
  })
  tasksSecondary1: Task[]
  @Fields.many<Category, Task>(() => Task, {
    //match: [['id', 'secondaryCategoryId']],
    fields: {
      secondaryCategoryId: 'id',
    },
    findOptions: {
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
    },
  })
  tasksSecondary2: Task[]
  @Fields.many<Category, Task>(() => Task, {
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
  @Fields.one(Category, () => Task, {
    findOptions: (category) => ({
      orderBy: {
        id: 'desc',
      },
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
  lastTask: Task
  @Fields.date()
  createdAt = new Date('1976-06-16T00:00:00.000Z')

  @Fields.reference(() => Company)
  company!: Company

  @Fields.integer()
  secondaryCompanyId = 0

  @Fields.one(Category, () => Company, 'secondaryCompanyId')
  secondaryCompany: Company
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.reference(() => Category)
  category!: Category
  @Fields.boolean()
  completed = false

  @Fields.integer()
  secondaryCategoryId = 0
  @Fields.one(Task, () => Category, 'secondaryCategoryId')
  secondaryCategory!: Category
  @Fields.one(Task, () => Category, {
    field: 'secondaryCategoryId',
  })
  secondaryCategory1!: Category
  @Fields.one(Task, () => Category, {
    fields: { id: 'secondaryCategoryId' },
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
    const comp = await r(Company).insert([
      { id: 10, companyName: 'comp10' },
      { id: 20, companyName: 'comp20' },
    ])
    const c = await r(Category).insert([
      { id: 1, name: 'c1', company: comp[0], secondaryCompanyId: 20 },
      { id: 2, name: 'c2', company: comp[0], secondaryCompanyId: 10 },
      { id: 3, name: 'c3', company: comp[1], secondaryCompanyId: 20 },
    ])
    await r(Task).insert([
      { id: 1, title: 't1', category: c[0], secondaryCategoryId: 3 },
      { id: 2, title: 't2', category: c[1], secondaryCategoryId: 3 },
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
        "company": undefined,
        "createdAt": 1976-06-16T00:00:00.000Z,
        "id": 1,
        "name": "c1",
        "secondaryCompanyId": 20,
      }
    `)
  })
  it('loads reference to field', async () => {
    const t = await r(Task).findFirst(
      { id: 1 },
      {
        include: {
          secondaryCategory: {
            include: {
              company: true,
            },
          },
          secondaryCategory1: { include: { company: true } },
          secondaryCategory2: { include: { company: true } },
        },
      },
    )
    expect(t.secondaryCategory).toMatchInlineSnapshot(`
      Category {
        "company": Company {
          "companyName": "comp20",
          "id": 20,
        },
        "createdAt": 1976-06-16T00:00:00.000Z,
        "id": 3,
        "name": "c3",
        "secondaryCompanyId": 20,
      }
    `)
    expect(t.secondaryCategory.company.companyName).toBe('comp20')
    expect(t.secondaryCategory1.company.companyName).toBe('comp20')
    expect(t.secondaryCategory2.company.companyName).toBe('comp20')
    t.title = 't2'
    const t2 = await r(Task).save(t)
    expect(t.title).toBe('t2')
    expect(t.secondaryCategory.company.companyName).toBe('comp20')
    expect(t2.secondaryCategory.company.companyName).toBe('comp20')
    expect(
      (await r(Task).update(t, { title: 't3' })).secondaryCategory.company
        .companyName,
    ).toBe('comp20')
    expect(
      (await r(Task).save({ ...t, title: 't3' })).secondaryCategory.company
        .companyName,
    ).toBe('comp20')
    expect(
      (await r(Task).update({ ...t }, { title: 't3' })).secondaryCategory
        .company.companyName,
    ).toBe('comp20')
  })
  it('test update and return of referenced fields', async () => {
    const t = await r(Task).findFirst(
      { id: 1 },
      {
        include: {
          secondaryCategory: {
            include: {
              company: true,
            },
          },
        },
      },
    )
    expect(t.secondaryCategory.company.companyName).toBe('comp20')

    expect(
      (await r(Task).update({ ...t }, { title: 't3' })).secondaryCategory
        .company.companyName,
    ).toBe('comp20')
  })
  it('loads many', async () => {
    const t = await r(Category).find({
      include: {
        tasks: true,
      },
    })
    expect(
      t.map(({ id, name, tasks }) => ({
        id,
        name,
        tasks: tasks.map((t) => t.id),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "name": "c1",
          "tasks": [
            1,
            3,
          ],
        },
        {
          "id": 2,
          "name": "c2",
          "tasks": [
            2,
            4,
          ],
        },
        {
          "id": 3,
          "name": "c3",
          "tasks": [],
        },
      ]
    `)
  })
  it('load recursive', async () => {
    const t = await r(Category).find({
      include: {
        tasks: {
          include: {
            secondaryCategory: true,
          },
        },
      },
    })
    expect(t[0].tasks[0].secondaryCategory.id).toBe(3)
  })

  it('test match and limit', async () => {
    remult.dataProvider = new InMemoryDataProvider()
    {
      const [c1, c2] = await r(Category).insert([
        { id: 1, name: 'c1' },
        { id: 2, name: 'c2' },
      ])
      await r(Task).insert([
        { id: 1, category: c1 },
        { id: 2, category: c2 },
        { id: 3, category: c1 },
      ])
    }
    {
      const [c1, c2] = await r(Category).find({
        include: {
          lastTask: true,
        },
      })
      expect(c1.lastTask.id).toBe(3)
      expect(c2.lastTask.id).toBe(2)
    }
  })
  it('to and from json work', async () => {
    var c = await r(Category).findFirst()
    const taskOptions = findOptionsToJson(
      {
        where: {
          category: c,
        },
      },
      r(Task).metadata,
    )
    var options = findOptionsToJson(
      {
        include: {
          tasksSecondary: {
            where: {
              category: c,
            },
          },
        },
      },
      r(Category).metadata,
    )
    expect(options.include.tasksSecondary).toEqual(taskOptions)
    const revisedOptions = findOptionsFromJson(options, r(Category).metadata)

    expect(revisedOptions).toMatchInlineSnapshot(`
      {
        "include": {
          "tasksSecondary": {
            "where": {
              "category": 1,
            },
          },
        },
      }
    `)

    const cats = await r(Category).find(revisedOptions)
    expect(
      cats.map((c) => ({
        id: c.id,
        tasksSecondary: c.tasksSecondary.map((t) => t.id),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "tasksSecondary": [],
        },
        {
          "id": 2,
          "tasksSecondary": [],
        },
        {
          "id": 3,
          "tasksSecondary": [
            1,
            3,
          ],
        },
      ]
    `)
  })
  it('basic to and from json work', async () => {
    var c = await r(Category).findFirst({ id: 2 })
    const taskOptions = findOptionsToJson(
      {
        where: {
          category: c,
        },
      },
      r(Task).metadata,
    )
    const revisedOptions = findOptionsFromJson(taskOptions, r(Task).metadata)
    expect((await r(Task).find(revisedOptions)).map((x) => x.id))
      .toMatchInlineSnapshot(`
        [
          2,
          4,
        ]
      `)
  })
  it.only('test optimization', async () => {
    const dp = TestDataProvider(remult.dataProvider)
    remult.dataProvider = dp

    await r(Task).find({
      include: {
        category: {
          include: {
            company: true,
          },
        },
        secondaryCategory: {
          include: {
            company: true,
          },
        },
      },
    })
    expect(dp.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "tasks",
          "where": {},
        },
        {
          "entity": "categories",
          "where": {
            "id.in": [
              1,
              2,
            ],
          },
        },
        {
          "entity": "categories",
          "where": {
            "id": 1,
          },
        },
        {
          "entity": "categories",
          "where": {
            "id": 2,
          },
        },
        {
          "entity": "categories",
          "where": {
            "id": 3,
          },
        },
        {
          "entity": "company",
          "where": {
            "id": 10,
          },
        },
        {
          "entity": "company",
          "where": {
            "id": 10,
          },
        },
        {
          "entity": "company",
          "where": {
            "id": 20,
          },
        },
        {
          "entity": "company",
          "where": {
            "id": 10,
          },
        },
        {
          "entity": "company",
          "where": {
            "id": 20,
          },
        },
      ]
    `)
  })
})

//[ ] optimize fetches
