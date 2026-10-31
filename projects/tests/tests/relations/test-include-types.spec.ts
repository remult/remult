import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  type Loaded,
  type MembersToInclude,
} from '../../../core'

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
  it('nullable relation stays nullable', async () => {
    const categories = await remult
      .repo(Category)
      .find({ include: { company: true }, orderBy: { id: 'asc' } })
    expectTypeOf(categories[0].company).toEqualTypeOf<Company | null>()
    expect(categories.map((c) => c.company?.name ?? null)).toEqual([
      'comp1',
      null,
    ])
  })
  it('nested include is loaded', async () => {
    const task = await remult
      .repo(Task)
      .findOne({ include: { category: { include: { company: true } } } })
    expectTypeOf(task!.category.company).toEqualTypeOf<Company | null>()
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
})
