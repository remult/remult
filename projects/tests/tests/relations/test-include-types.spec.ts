import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  type Loaded,
  type MembersToInclude,
  type Repository,
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
  it('included to one relation is loaded', async () => {
    const tasks = await remult.repo(Task).find({ include: { category: true } })
    expect(tasks[0].category.name).toBe('cat1')
  })
  it('included to many relation is loaded', async () => {
    const category = await remult
      .repo(Category)
      .findId(1, { include: { tasks: true } })
    expect(category!.tasks.map((t) => t.title)).toEqual(['task1'])
  })
  it('nullable relation stays nullable', async () => {
    const categories = await remult
      .repo(Category)
      .find({ include: { company: true }, orderBy: { id: 'asc' } })
    const companies: (Company | null)[] = categories.map((c) => c.company)
    expect(companies.map((c) => c?.name ?? null)).toEqual(['comp1', null])
  })
  it('nested include is loaded', async () => {
    const task = await remult
      .repo(Task)
      .findOne({ include: { category: { include: { company: true } } } })
    const company: Company | null = task!.category.company
    expect(company?.name).toBe('comp1')
  })
  it('loaded type can annotate a result', async () => {
    const task: Loaded<Task, { category: true }> | undefined = await remult
      .repo(Task)
      .findFirst({}, { include: { category: true } })
    expect(task!.category.name).toBe('cat1')
  })
})

async function testIncludeTypes() {
  const taskRepo: Repository<Task> = undefined!

  const plain = await taskRepo.find()
  // @ts-expect-error - category was not included
  plain[0].category.name

  const excluded = await taskRepo.find({ include: { category: false } })
  // @ts-expect-error - category was excluded
  excluded[0].category.name

  const wide: MembersToInclude<Task> = { category: true }
  const fromWide = await taskRepo.find({ include: wide })
  // @ts-expect-error - a widened include may not load category
  fromWide[0].category.name

  const shallow = await taskRepo.find({ include: { category: true } })
  // @ts-expect-error - company was not included
  const company: Company | null = shallow[0].category.company

  await taskRepo.find({
    // @ts-expect-error - companyy is not a member of Category
    include: { category: { include: { companyy: true } } },
  })
}
