import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  FindFirstOptions,
  FindOptions,
  InMemoryDataProvider,
  Relations,
  Remult,
  getEntityRef,
} from '../../../core'
import type { ClassType } from '../../../core/classType'

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
  @Relations.toOne(() => Company)
  company!: Company
}

@Entity('tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.boolean()
  completed = false
  @Relations.toOne(() => Category)
  category!: Category
}
describe('test repository relations', () => {
  let remult: Remult
  function r<entityType>(entity: ClassType<entityType>) {
    return remult.repo(entity)
  }
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    const c = await r(Category).insert({
      id: 1,
      name: 'cat1',
      company: await r(Company).insert({ id: 11, name: 'comp1' }),
    })
    await r(Task).insert({ id: 101, title: 'task1', category: c })
    remult.clearAllCache()
  })
  it("test doesn't fetch category", async () => {
    expect(await r(Task).findFirst()).toMatchInlineSnapshot(`
      Task {
        "completed": false,
        "id": 101,
        "title": "task1",
      }
    `)
  })
  it('test  fetch category', async () => {
    expect(
      await r(Task).findFirst(
        {},
        {
          include: {
            category: true,
          },
        },
      ),
    ).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "id": 1,
          "name": "cat1",
        },
        "completed": false,
        "id": 101,
        "title": "task1",
      }
    `)
  })
  it('test  fetch category and include company', async () => {
    expect(
      await r(Task).findFirst(
        {},
        {
          include: {
            category: { include: { company: true } },
          },
        },
      ),
    ).toMatchInlineSnapshot(`
      Task {
        "category": Category {
          "company": Company {
            "id": 11,
            "name": "comp1",
          },
          "id": 1,
          "name": "cat1",
        },
        "completed": false,
        "id": 101,
        "title": "task1",
      }
    `)
  })
  it('test fetch category and not include', async () => {
    const t = await r(Task).findFirst(
      {},
      {
        include: {},
      },
    )
    expect(t!.category).toBeUndefined()
    expect(getEntityRef(t!).fields.category.getId()).toBe(1)
  })
})
