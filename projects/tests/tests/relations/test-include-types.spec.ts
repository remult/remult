import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
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
  @Relations.toOne<Category, Company>(() => Company, 'companyId')
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

describe('include result types', () => {
  let remult: Remult
  let taskRepo: Repository<Task>
  let categoryRepo: Repository<Category>
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    taskRepo = remult.repo(Task)
    categoryRepo = remult.repo(Category)
    const company = await remult.repo(Company).insert({ id: 11, name: 'c' })
    const withCompany = await categoryRepo.insert({
      id: 1,
      name: 'cat1',
      companyId: company.id,
    })
    await categoryRepo.insert({ id: 2, name: 'cat2' })
    await taskRepo.insert({ id: 101, title: 't1', category: withCompany })
  })

  it('leaves the type alone without an include', async () => {
    expectTypeOf(await taskRepo.find()).toEqualTypeOf<Task[]>()
    expectTypeOf(await taskRepo.find({ where: { id: 101 } })).toEqualTypeOf<
      Task[]
    >()
    expectTypeOf(await taskRepo.findFirst()).toEqualTypeOf<Task | undefined>()
  })

  it('types an included to-one relation as loaded', async () => {
    const [task] = await taskRepo.find({ include: { category: true } })
    expectTypeOf(task.category).toEqualTypeOf<Category>()
    expect(task.category.name).toBe('cat1')
  })

  it('keeps null on a relation declared nullable', async () => {
    const categories = await categoryRepo.find({
      include: { company: true },
      orderBy: { id: 'asc' },
    })
    expectTypeOf(categories[0].company).toEqualTypeOf<Company | null>()
    expect(categories.map((c) => c.company?.name ?? null)).toEqual(['c', null])
  })

  it('types an included to-many relation as an array', async () => {
    const category = await categoryRepo.findId(1, { include: { tasks: true } })
    expectTypeOf(category!.tasks).toEqualTypeOf<Task[]>()
    expect(category!.tasks.map((t) => t.id)).toEqual([101])
  })

  it('applies nested includes recursively', async () => {
    const task = await taskRepo.findOne({
      include: { category: { include: { company: true } } },
    })
    expectTypeOf(task!.category.company).toEqualTypeOf<Company | null>()
    expect(task!.category.company?.name).toBe('c')

    const shallow = await taskRepo.findOne({ include: { category: true } })
    expectTypeOf(shallow!.category.company).toEqualTypeOf<
      Company | null | undefined
    >()
  })

  it('does not narrow members that may not be loaded', async () => {
    const excluded = await taskRepo.find({ include: { category: false } })
    expectTypeOf(excluded).toEqualTypeOf<Task[]>()

    const wide: MembersToInclude<Task> = { category: true }
    const [task] = await taskRepo.find({ include: wide })
    expectTypeOf(task.category).toEqualTypeOf<Category | undefined>()
  })

  it('rejects unknown members in a nested include', async () => {
    await taskRepo.find({
      // @ts-expect-error `companyy` is not a member of Category
      include: { category: { include: { companyy: true } } },
    })
  })

  it('exports Loaded for annotating results', () => {
    expectTypeOf<
      Loaded<Task, { category: true }>['category']
    >().toEqualTypeOf<Category>()
    expectTypeOf<Loaded<Task, {}>>().toEqualTypeOf<Task>()
  })
})
