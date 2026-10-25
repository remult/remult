import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  type EntitySelectFields,
  type Selected,
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
  @Relations.toMany<Category, Task>(() => Task, 'categoryId')
  tasks?: Task[]
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.boolean()
  completed = false
  @Fields.integer()
  categoryId = 0
  @Relations.toOne<Task, Category>(() => Category, 'categoryId')
  category?: Category
  describe() {
    return this.title
  }
}

describe('test select types', () => {
  let remult: Remult
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const company = await remult.repo(Company).insert({ id: 11, name: 'comp1' })
    const category = await remult
      .repo(Category)
      .insert({ id: 1, name: 'cat1', companyId: company.id })
    await remult
      .repo(Task)
      .insert({ id: 101, title: 'task1', categoryId: category.id })
  })
  it('selected members are kept and the rest are dropped', async () => {
    const tasks = await remult.repo(Task).find({ select: { title: true } })
    expectTypeOf(tasks).toEqualTypeOf<
      Omit<Task, 'id' | 'completed' | 'categoryId' | 'category'>[]
    >()
    expect(tasks[0].title).toBe('task1')
    expect(tasks[0].describe()).toBe('task1')
  })
  it('false drops a member and a widened boolean keeps it', async () => {
    const maybe = true as boolean
    const task = await remult
      .repo(Task)
      .findFirst({}, { select: { title: maybe, completed: false } })
    expectTypeOf(task!).toEqualTypeOf<
      Omit<Task, 'id' | 'completed' | 'categoryId' | 'category'>
    >()
  })
  it('widened select keeps the entity type', async () => {
    const select: EntitySelectFields<Task> = { title: true }
    expectTypeOf(await remult.repo(Task).find({ select })).toEqualTypeOf<
      Task[]
    >()
  })
  it('included relation is kept and loaded', async () => {
    const task = await remult.repo(Task).findOne({
      select: { title: true, categoryId: true },
      include: { category: true },
    })
    expectTypeOf(task!.category).toEqualTypeOf<Category>()
    expectTypeOf(task!).not.toHaveProperty('completed')
    expect(task!.category.name).toBe('cat1')
  })
  it('select inside include narrows the relation', async () => {
    const task = await remult.repo(Task).findOne({
      select: { title: true, categoryId: true },
      include: {
        category: {
          select: { name: true, companyId: true },
          include: { company: true },
        },
      },
    })
    expectTypeOf(task!.category.company).toEqualTypeOf<Company | null>()
    expectTypeOf(task!.category).not.toHaveProperty('id')
    expect(task!.category.company?.name).toBe('comp1')
  })
  it('select inside a to many include narrows its rows', async () => {
    const category = await remult.repo(Category).findId(1, {
      include: { tasks: { select: { title: true } } },
    })
    expectTypeOf(category!.tasks).toEqualTypeOf<
      Omit<Task, 'id' | 'completed' | 'categoryId' | 'category'>[]
    >()
    expect(category!.tasks.map((t) => t.title)).toEqual(['task1'])
  })
  it('unknown member in select is an error', () => {
    expectTypeOf(remult.repo(Task).find).toBeCallableWith({
      // @ts-expect-error - titlee is not a member of Task
      select: { titlee: true },
    })
  })
  it('selected row is accepted by the repository', async () => {
    const repo = remult.repo(Task)
    const [task] = await repo.find({ select: { id: true, title: true } })

    expect(repo.getEntityRef(task).toApiJson()).toEqual({
      id: 101,
      title: 'task1',
    })
  })
  it('selected type matches the find result', () => {
    expectTypeOf<Selected<Task, { title: true }>>().toEqualTypeOf<
      Omit<Task, 'id' | 'completed' | 'categoryId' | 'category'>
    >()
    expectTypeOf<
      Selected<Task, EntitySelectFields<Task>>
    >().toEqualTypeOf<Task>()
  })
})
