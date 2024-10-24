import { describe, it, expect, beforeEach, beforeAll, test } from 'vitest'
import {
  Entity,
  Field,
  Fields,
  FindFirstOptions,
  FindOptions,
  InMemoryDataProvider,
  Relations,
  Remult,
  dbNamesOf,
  describeClass,
  remult,
} from '../../../core'
import type { ClassType } from '../../../core/classType'
import { TestDataProvider } from '../../dbs/TestDataProviderWithStats'
import {
  findOptionsFromJson,
  findOptionsToJson,
} from '../../../core/src/data-providers/rest-data-provider'
import { TestDataApiResponse } from '../TestDataApiResponse'
import { entity } from '../dynamic-classes'
import { getRelationFieldInfo } from '../../../core/src/remult3/relationInfoMember'

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
  @Relations.toMany(() => Task, 'category')
  tasks?: Task[]
  @Relations.toMany(() => Task, 'secondaryCategoryId')
  tasksSecondary?: Task[]
  @Relations.toMany(() => Task, {
    field: 'secondaryCategoryId',
    findOptions: {
      limit: 2,
    },
  })
  tasksSecondary1?: Task[]
  @Relations.toMany<Category, Task>(() => Task, {
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
  tasksSecondary2!: Task[]
  @Relations.toMany<Category, Task>(() => Task, {
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
  allTasks!: Task[]
  @Relations.toOne<Category, Task>(() => Task, {
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
  lastTask!: Task
  @Fields.date()
  createdAt = new Date('1976-06-16T00:00:00.000Z')

  @Relations.toOne(() => Company)
  company!: Company

  @Fields.integer()
  secondaryCompanyId = 0

  @Relations.toOne<Category, Company>(() => Company, 'secondaryCompanyId')
  secondaryCompany!: Company
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Relations.toOne(() => Category)
  category?: Category
  @Fields.boolean()
  completed = false

  @Fields.integer()
  secondaryCategoryId = 0
  @Relations.toOne<Task, Category>(() => Category, 'secondaryCategoryId')
  secondaryCategory?: Category
  @Relations.toOne<Task, Category>(() => Category, {
    field: 'secondaryCategoryId',
  })
  secondaryCategory1?: Category
  @Relations.toOne<Task, Category>(() => Category, {
    fields: { id: 'secondaryCategoryId' },
  })
  secondaryCategory2?: Category
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
  it('test input type', async () => {
    expect(r(Task).fields.category!.inputType).toMatchInlineSnapshot('""')
  })
  it('test fields info', async () => {
    const rl = getRelationFieldInfo(r(Task).fields.category!)
    expect(await rl!.toRepo.count()).toMatchInlineSnapshot('3')
  })

  it('no extra data is loaded', async () => {
    let stats = (remult.dataProvider = TestDataProvider(remult.dataProvider))
    const t = await r(Task).findFirst({ id: 4 })
    expect(t!.category).toBeUndefined()
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
    expect(t!.category).toMatchInlineSnapshot(`
      Category {
        "createdAt": 1976-06-16T00:00:00.000Z,
        "id": 1,
        "name": "c1",
        "secondaryCompanyId": 20,
      }
    `)
  })
  it('test include ', async () => {
    expect(
      await r(Task).findFirst(
        { id: 1 },
        {
          include: {
            category: true,
            secondaryCategory: true,
          },
        },
      ),
    ).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "createdAt": 1976-06-16T00:00:00.000Z,
          "id": 1,
          "name": "c1",
          "secondaryCompanyId": 20,
        },
        "completed": false,
        "id": 1,
        "secondaryCategory": Category {
          "createdAt": 1976-06-16T00:00:00.000Z,
          "id": 3,
          "name": "c3",
          "secondaryCompanyId": 20,
        },
        "secondaryCategoryId": 3,
        "title": "t1",
      }
    `)
  })
  it('test not include', async () => {
    expect(
      await r(Task).findFirst(
        { id: 1 },
        {
          include: {
            category: false,
            secondaryCategory: false,
          },
        },
      ),
    ).toMatchInlineSnapshot(`
      Task {
        "completed": false,
        "id": 1,
        "secondaryCategoryId": 3,
        "title": "t1",
      }
    `)
  })
  it('loads reference to field', async () => {
    const t = (await r(Task).findFirst(
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
    ))!
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
    expect(t.secondaryCategory!.company.companyName).toBe('comp20')
    expect(t.secondaryCategory1!.company.companyName).toBe('comp20')
    expect(t.secondaryCategory2!.company.companyName).toBe('comp20')
    t.title = 't2'
    const t2 = await r(Task).save(t)
    expect(t.title).toBe('t2')
    expect(t.secondaryCategory!.company.companyName).toBe('comp20')
    expect(t2.secondaryCategory!.company.companyName).toBe('comp20')
    expect(
      (await r(Task).update(t, { title: 't3' })).secondaryCategory!.company
        .companyName,
    ).toBe('comp20')
    expect(
      (await r(Task).save({ ...t, title: 't3' })).secondaryCategory!.company
        .companyName,
    ).toBe('comp20')
    expect(
      (await r(Task).update({ ...t }, { title: 't3' })).secondaryCategory!
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
    expect(t!.secondaryCategory!.company.companyName).toBe('comp20')

    expect(
      (await r(Task).update({ ...t }, { title: 't3' }))!.secondaryCategory!
        .company.companyName,
    ).toBe('comp20')
  })
  it('test query', async () => {
    const t = (
      await r(Task)
        .query({
          where: { id: 1 },
          include: {
            secondaryCategory: {
              include: {
                company: true,
              },
            },
          },
        })
        .getPage(1)
    )[0]
    expect(t!.secondaryCategory!.company.companyName).toBe('comp20')
  })
  it('test query for await', async () => {
    const q = r(Task).query({
      where: { id: 1 },
      include: {
        secondaryCategory: {
          include: {
            company: true,
          },
        },
      },
    })
    for await (const t of q) {
      expect(t!.secondaryCategory!.company.companyName).toBe('comp20')
      return
    }
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
        tasks: tasks!.map((t) => t.id),
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
    const dp = TestDataProvider(remult.dataProvider)
    remult.dataProvider = dp
    const t = await r(Category).find({
      include: {
        tasks: {
          include: {
            secondaryCategory: true,
          },
        },
      },
      limit: 1,
    })
    expect(dp.finds).toMatchInlineSnapshot(`
      [
        {
          "entity": "categories",
          "where": {},
        },
        {
          "entity": "tasks",
          "where": {
            "category": 1,
          },
        },
        {
          "entity": "categories",
          "where": {
            "id": 3,
          },
        },
      ]
    `)
    expect(t[0].tasks![0]!.secondaryCategory!.id).toBe(3)
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
    expect(options.include!.tasksSecondary).toEqual(taskOptions)
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
        tasksSecondary: c.tasksSecondary!.map((t) => t.id),
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
  it('test optimization', async () => {
    const dp = TestDataProvider(remult.dataProvider)
    remult.dataProvider = dp

    const result = await r(Task).find({
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
              3,
            ],
          },
        },
        {
          "entity": "company",
          "where": {
            "id.in": [
              10,
              20,
            ],
          },
        },
      ]
    `)
    expect(result[0].category!.company.id).toBe(10)
  })
  it('to many', async () => {
    remult.dataProvider = new InMemoryDataProvider()
    await remult.repo(Category).insert({ id: 1, name: 'c1' })
    expect(await remult.repo(Category).findOne({})).toMatchInlineSnapshot(`
      Category {
        "createdAt": 1976-06-16T00:00:00.000Z,
        "id": 1,
        "name": "c1",
        "secondaryCompanyId": 0,
      }
    `)
  })
  it('loads ok also with old field reference', async () => {
    const td = TestDataProvider()
    remult.dataProvider = td
    const Company = entity('companies', {
      id: Fields.integer(),
      name: Fields.string(),
    })
    const Category = entity('categories', {
      id: Fields.integer(),
      name: Fields.string(),
      company: Field(() => Company),
    })
    const Task = entity('tasks', {
      id: Fields.integer(),
      title: Fields.string(),
      category: Field(() => Category),
    })
    const [comp1, comp2] = await r(Company).insert([
      { id: 1, name: 'comp1' },
      { id: 2, name: 'comp2' },
    ])
    const [cat1, cat2] = await r(Category).insert([
      { id: 1, name: 'cat1', company: comp1 },
      { id: 2, name: 'cat2', company: comp2 },
    ])
    await r(Task).insert([
      { id: 1, title: 't1', category: cat1 },
      { id: 2, title: 't2', category: cat2 },
      { id: 3, title: 't3', category: cat1 },
    ])
    remult.clearAllCache()
    const tasks = await r(Task).query({ include: {} }).getPage(1)
    expect(tasks.map((y) => y.category.company.id)).toEqual([1, 2, 1])
    expect(td.finds).toMatchInlineSnapshot(`
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
          "entity": "companies",
          "where": {
            "id.in": [
              1,
              2,
            ],
          },
        },
      ]
    `)
  })

  it("doesn't share cache with old fields", async () => {
    remult.dataProvider = new InMemoryDataProvider()
    const Company = entity('companies', {
      id: Fields.integer(),
      name: Fields.string(),
    })
    const Category = entity('categories', {
      id: Fields.integer(),
      name: Fields.string(),
      company: Field(() => Company),
      companyRef: Relations.toOne(() => Company),
    })

    const comp = await r(Company).insert({ id: 1, name: 'abc' })
    await r(Category).insert({
      id: 1,
      name: 'cat1',
      company: comp,
      companyRef: comp,
    })
    let c = (await r(Category).findFirst())!
    expect(c.company.id).toBe(1)
    expect(c.companyRef).toBeUndefined()
    const prevComp = c.company
    c = (await r(Category).findFirst(
      {},
      {
        include: {
          companyRef: true,
        },
      },
    ))!
    expect(c.company == prevComp).toBe(true)
  })
  it('fails with error field', async () => {
    const MyTask = class {
      id = 0
      category!: Category
    }
    describeClass(MyTask, Entity('myTask'), {
      id: Fields.integer(),
      category: Relations.toOne(() => Category, 'asdf'),
    })
    await r(MyTask).insert({ id: 1 })
    await expect(() =>
      r(MyTask).find({ include: { category: true } }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Error for relation: "myTask.category", Field "asdf" was not found in "myTask".]`,
    )
  })
  it('fails when cant anticipate many', async () => {
    const MyTask = class {
      id = 0
      categories!: Category[]
    }
    describeClass(MyTask, Entity('asdf'), {
      id: Fields.integer(),
      categories: Relations.toMany(() => Category),
    })
    await r(MyTask).insert({ id: 1 })
    await expect(() =>
      r(MyTask).find({ include: { categories: true } }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Error for relation: "asdf.categories", No matching field found on target "categories". Please specify field/fields]`,
    )
  })
})

it('test new id definition', async () => {
  const old = entity(
    'old',
    {
      a: Fields.number(),
      b: Fields.number(),
    },
    {
      id: (x) => [x.a, x.b],
    },
  )
  const new_ = entity(
    'new',
    { a: Fields.number(), b: Fields.number() },
    {
      id: {
        a: true,
        b: true,
      },
    },
  )
  expect(remult.repo(old).metadata.idMetadata.getId({ a: 1, b: 2 })).toBe('1,2')
  expect(remult.repo(new_).metadata.idMetadata.getId({ a: 1, b: 2 })).toBe(
    '1,2',
  )
})

it('test null and related field ', async () => {
  const remult = new Remult(new InMemoryDataProvider())

  const Customer = entity('customer', {
    id: Fields.string(),
    name: Fields.string(),
  })
  const Order = entity('orders', {
    id: Fields.integer(),
    customerId: Fields.string({ allowNull: true }),
    customer: Relations.toOne(() => Customer, 'customerId'),
  })
  const customers = await remult
    .repo(Customer)
    .insert([{ name: 'noam', id: '1' }])
  await remult.repo(Order).insert({ customerId: customers[0].id })

  const o = await remult
    .repo(Order)
    .findFirst({}, { include: { customer: true } })
  expect(o!.customer.name).toBe('noam')
})
it('test dbname', async () => {
  expect((await dbNamesOf(remult.repo(Task))).secondaryCategory).toBe(
    'secondaryCategoryId',
  )
})

describe('test setting of id and relation field', async () => {
  @Entity('cat123')
  class Category {
    @Fields.integer()
    id = 0
    @Fields.string()
    name = ''
  }
  @Entity('task123')
  class Task {
    @Fields.integer()
    id = 0
    @Relations.toOne<Task, Category>(() => Category, 'categoryId')
    category!: Category
    @Fields.integer()
    categoryId = 0
  }
  let r: typeof remult.repo
  let cat: Category
  let cat2: Category
  beforeEach(async () => {
    r = new Remult(new InMemoryDataProvider()).repo
    cat = await r(Category).insert({ id: 1, name: 'c1' })
    cat2 = await r(Category).insert({ id: 2, name: 'c2' })
  })
  it('test insert based on id', async () => {
    await r(Task).insert({ id: 1, categoryId: cat.id })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(1)
    expect(t.category.id).toBe(1)
  })
  it('test insert 2', async () => {
    await r(Task).insert({ id: 1, category: cat2, categoryId: cat.id })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(1)
    expect(t.category.id).toBe(1)
  })
  it('test insert 3', async () => {
    await r(Task).insert({ id: 1, categoryId: cat.id, category: cat2 })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(2)
    expect(t.category.id).toBe(2)
  })
  it('test insert 3', async () => {
    await r(Task).insert({ id: 1, category: cat2, categoryId: cat.id })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(1)
    expect(t.category.id).toBe(1)
  })
  it('test save', async () => {
    await r(Task).insert({ id: 1, categoryId: cat.id })
    await r(Task).save({
      id: 1,
      category: { id: undefined! } as any,
      categoryId: cat2.id,
    })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(2)
    expect(t.category.id).toBe(2)
  })
  it('test update', async () => {
    await r(Task).insert({ id: 1, categoryId: cat.id })
    await r(Task).update(1, {
      category: { id: undefined! } as any,
      categoryId: cat2.id,
    })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(2)
    expect(t.category.id).toBe(2)
  })
  it('test update many', async () => {
    await r(Task).insert({ id: 1, categoryId: cat.id })
    await r(Task).updateMany({
      where: { id: 1 },
      set: {
        category: { id: undefined! } as any,
        categoryId: cat2.id,
      },
    })
    const t = (await r(Task).findFirst(
      { id: 1 },
      { include: { category: true } },
    ))!
    expect(t.categoryId).toBe(2)
    expect(t.category.id).toBe(2)
  })
})
describe('test result for unpopulated toMany relation', () => {
  test('simpler test', async () => {
    @Entity('tasks')
    class Task {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
      @Fields.integer()
      categoryId = 0
    }
    @Entity('categories')
    class CategoryToManyTest {
      @Fields.integer()
      id = 0
      @Fields.string()
      title = ''
      @Relations.toMany<Category, Task>(() => Task, 'categoryId')
      tasks: Task[] = []
      @Relations.toMany<Category, Task>(() => Task, 'categoryId')
      tasks2?: Task[]
    }

    const r = new Remult(new InMemoryDataProvider())
    await r.repo(CategoryToManyTest).insert({ id: 1, title: 'c1' })
    expect(await r.repo(CategoryToManyTest).find()).toMatchInlineSnapshot(`
    [
      CategoryToManyTest {
        "id": 1,
        "title": "c1",
      },
    ]
  `)
  })
})
