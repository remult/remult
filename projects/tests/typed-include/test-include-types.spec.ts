import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  type Loaded,
  type MembersToInclude,
  type ClassType,
  type LiveQuery,
  type QueryResult,
} from '../../core'

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
  @Fields.integer({ allowNull: true })
  companyId: number | null = null
  @Relations.toOne<Category, Company>(() => Company, { field: 'companyId' })
  company?: Company | null
  @Relations.toMany(() => Task)
  tasks?: Task[]
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Relations.toOne(() => Category)
  category?: Category
}

@Entity('branch-customers')
class BranchCustomer {
  @Fields.integer()
  id = 0
  @Fields.integer()
  branchId = 0
  @Fields.string()
  name = ''
}

@Entity('branch-orders')
class BranchOrder {
  @Fields.integer()
  id = 0
  @Fields.integer()
  branchId = 0
  @Fields.integer()
  customerId = 0
  @Relations.toOne<BranchOrder, BranchCustomer>(() => BranchCustomer, {
    fields: { branchId: 'branchId', id: 'customerId' },
  })
  customer?: BranchCustomer | null
}

describe('test include types', () => {
  let remult: Remult
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const company = await remult.repo(Company).insert({ id: 11, name: 'comp1' })
    const category = await remult
      .repo(Category)
      .insert({ id: 1, name: 'cat1', companyId: company.id })
    await remult.repo(Category).insert({ id: 2, name: 'cat2' })
    await remult.repo(Task).insert({ id: 101, title: 'task1', category })
  })
  it('no include keeps the entity type', async () => {
    expectTypeOf(await remult.repo(Task).find()).toEqualTypeOf<Task[]>()
    expectTypeOf(await remult.repo(Task).findFirst()).toEqualTypeOf<
      Task | undefined
    >()
  })
  it('included to one relation is loaded', async () => {
    const tasks = await remult.repo(Task).find({ include: { category: true } })
    expectTypeOf(tasks[0].category).toEqualTypeOf<Category>()
    expect(tasks[0].category.name).toBe('cat1')
  })
  it('included to many relation is loaded', async () => {
    const category = await remult
      .repo(Category)
      .findId(1, { include: { tasks: true } })
    expectTypeOf(category!.tasks).toEqualTypeOf<Task[]>()
    expect(category!.tasks.map((t) => t.title)).toEqual(['task1'])
  })
  it('array methods on a to many relation keep its nested include', async () => {
    const category = await remult
      .repo(Category)
      .findId(1, { include: { tasks: { include: { category: true } } } })
    const categories = category!.tasks.map((t) => t.category)
    expectTypeOf(categories).toEqualTypeOf<Category[]>()
    expect(categories.map((c) => c.name)).toEqual(['cat1'])
    const found = category!.tasks.find((t) => t.id === 101)
    expectTypeOf(found!.category).toEqualTypeOf<Category>()
  })
  it('findIdOrThrow types an included relation as loaded', async () => {
    const category = await remult
      .repo(Category)
      .findIdOrThrow(1, { include: { tasks: true } })
    expectTypeOf(category.tasks).toEqualTypeOf<Task[]>()
    expect(category.tasks.map((t) => t.title)).toEqual(['task1'])
  })
  it('findFirstOrThrow and findOneOrThrow type an included relation as loaded', async () => {
    const first = await remult
      .repo(Category)
      .findFirstOrThrow({ id: 1 }, { include: { tasks: true } })
    expectTypeOf(first.tasks).toEqualTypeOf<Task[]>()
    const one = await remult
      .repo(Category)
      .findOneOrThrow({ where: { id: 1 }, include: { tasks: true } })
    expectTypeOf(one.tasks).toEqualTypeOf<Task[]>()
    expect(one.tasks.map((t) => t.title)).toEqual(['task1'])
  })
  it('query results type an included relation as loaded', async () => {
    const query = remult.repo(Task).query({ include: { category: true } })
    const page = await query.getPage()
    expectTypeOf(page[0].category).toEqualTypeOf<Category>()
    expect(page[0].category.name).toBe('cat1')
    const paginator = await query.paginator()
    expectTypeOf(paginator.items[0].category).toEqualTypeOf<Category>()
    for await (const task of query) {
      expectTypeOf(task.category).toEqualTypeOf<Category>()
      expect(task.category.name).toBe('cat1')
    }
  })
  it('query with aggregate types an included relation as loaded', async () => {
    const paginator = await remult
      .repo(Task)
      .query({ include: { category: true }, aggregate: { sum: ['id'] } })
      .paginator()
    expectTypeOf(paginator.items[0].category).toEqualTypeOf<Category>()
    expectTypeOf(paginator.aggregates.id.sum).toEqualTypeOf<number>()
    expect(paginator.aggregates.id.sum).toBe(101)
  })
  it('query without include keeps the entity type', async () => {
    expectTypeOf(remult.repo(Task).query()).toEqualTypeOf<QueryResult<Task>>()
    expectTypeOf(remult.repo(Task).query({ pageSize: 10 })).toEqualTypeOf<
      QueryResult<Task>
    >()
  })
  it('liveQuery types an included relation as loaded', () => {
    expectTypeOf(
      remult.repo(Task).liveQuery({ include: { category: true } }),
    ).toEqualTypeOf<LiveQuery<Loaded<Task, { readonly category: true }>>>()
    expectTypeOf(remult.repo(Task).liveQuery()).toEqualTypeOf<LiveQuery<Task>>()
  })
  it('nullable relation stays nullable', async () => {
    const categories = await remult
      .repo(Category)
      .find({ include: { company: true }, orderBy: { id: 'asc' } })
    expectTypeOf(categories[0].company).toEqualTypeOf<
      Company | null | undefined
    >()
    expect(categories.map((c) => c.company?.name ?? null)).toEqual([
      'comp1',
      null,
    ])
  })
  it('included relation with a missing target is undefined', async () => {
    await remult.repo(Category).insert({ id: 3, name: 'cat3', companyId: 99 })
    const category = await remult
      .repo(Category)
      .findId(3, { include: { company: true } })
    expect(category!.company).toBeUndefined()
    expect(category!.companyId).toBe(99)
  })
  it('included fields relation with a missing target is undefined', async () => {
    await remult.repo(BranchCustomer).insert({ id: 7, branchId: 1, name: 'c7' })
    await remult.repo(BranchOrder).insert([
      { id: 1, branchId: 1, customerId: 7 },
      { id: 2, branchId: 2, customerId: 7 },
    ])
    const orders = await remult
      .repo(BranchOrder)
      .find({ include: { customer: true }, orderBy: { id: 'asc' } })
    expectTypeOf(orders[0].customer).toEqualTypeOf<
      BranchCustomer | null | undefined
    >()
    expect(orders[0].customer?.name).toBe('c7')
    expect(orders[1].customer).toBeUndefined()
    expect(orders[1].branchId).toBe(2)
    expect(orders[1].customerId).toBe(7)
  })
  it('nested include is loaded', async () => {
    const task = await remult
      .repo(Task)
      .findOne({ include: { category: { include: { company: true } } } })
    expectTypeOf(task!.category.company).toEqualTypeOf<
      Company | null | undefined
    >()
    expect(task!.category.company?.name).toBe('comp1')
  })
  it('shallow include leaves nested relations optional', async () => {
    const task = await remult
      .repo(Task)
      .findOne({ include: { category: true } })
    expectTypeOf(task!.category.company).toEqualTypeOf<
      Company | null | undefined
    >()
  })
  it('excluded or widened include keeps the declared type', async () => {
    const excluded = await remult
      .repo(Task)
      .find({ include: { category: false } })
    expectTypeOf(excluded).toEqualTypeOf<Task[]>()

    const wide: MembersToInclude<Task> = { category: true }
    const fromWide = await remult.repo(Task).find({ include: wide })
    expectTypeOf(fromWide[0].category).toEqualTypeOf<Category | undefined>()
  })
  it('unknown member in nested include is an error', async () => {
    await remult.repo(Task).find({
      // @ts-expect-error - companyy is not a member of Category
      include: { category: { include: { companyy: true } } },
    })
  })
  it('loaded type matches the find result', () => {
    expectTypeOf<
      Loaded<Task, { category: true }>['category']
    >().toEqualTypeOf<Category>()
    expectTypeOf<Loaded<Task, {}>>().toEqualTypeOf<Task>()
  })
  it('generic helper indexes an include result by keyof T', async () => {
    async function firstValue<T>(type: ClassType<T>, key: keyof T) {
      const rows = await remult.repo(type).find({ include: {} })
      // @ts-expect-error - generic id, falls back to the include overload
      const row = await remult.repo(type).findId(rows[0][key])
      return [rows[0][key], row?.[key]]
    }
    expect(await firstValue(Task, 'id')).toEqual([101, 101])
  })
})
