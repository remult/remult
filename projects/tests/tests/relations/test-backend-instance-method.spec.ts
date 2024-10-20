import { it, expect, describe, beforeAll, beforeEach } from 'vitest'
import {
  BackendMethod,
  Entity,
  EntityBase,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
} from '../../../core'
import { ActionTestConfig, MockRestDataProvider } from '../testHelper'

describe('relations to one behavior', () => {
  @Entity('category')
  class Category extends EntityBase {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
  }

  let serverRemult = new Remult()
  let remult = new Remult()
  function r<T>(e: new () => T) {
    return remult.repo(e)
  }
  let doOnServer = async (t: Task) => {}

  @Entity('task', { allowApiCrud: true })
  class Task extends EntityBase {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
    static defaultCategoryId = 10
    @Fields.integer({ includeInApi: false })
    categoryId = Task.defaultCategoryId
    @Relations.toOne(() => Category, 'categoryId')
    category?: Category
    @Relations.toOne(() => Category, { includeInApi: false })
    cat2?: Category
    @BackendMethod({ allowed: true })
    async something() {
      this.title += '2'
      await doOnServer(this)
    }
  }

  beforeEach(async () => {
    ActionTestConfig.db = new InMemoryDataProvider()
    serverRemult = new Remult(ActionTestConfig.db)
    remult = new Remult(new MockRestDataProvider(serverRemult))
    await serverRemult.repo(Category).insert({ id: 1, title: 'category 1' })
  })

  it('test how backend method works a', async () => {
    await r(Task).insert({ id: 1, title: 'task 1' })
    Task.defaultCategoryId = 20
    expect(await serverRemult.repo(Task).findFirst({})).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "categoryId": 10,
        "id": 1,
        "title": "task 1",
      }
    `)
    let task = await r(Task).findFirst({})
    expect(task).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "id": 1,
        "title": "task 1",
      }
    `)
    doOnServer = async (task) => {
      expect(task).toMatchInlineSnapshot(`
        Task {
          "cat2": null,
          "category": undefined,
          "categoryId": 10,
          "id": 1,
          "title": "task 12",
        }
      `)
      await task.save()
      expect(task).toMatchInlineSnapshot(`
        Task {
          "cat2": null,
          "category": undefined,
          "categoryId": 10,
          "id": 1,
          "title": "task 12",
        }
      `)
    }
    await task!.something()
    expect(await serverRemult.repo(Task).findFirst({})).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "categoryId": 10,
        "id": 1,
        "title": "task 12",
      }
    `)
    expect(task).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "id": 1,
        "title": "task 12",
      }
    `)
    doOnServer = async (task) => {
      expect(task).toMatchInlineSnapshot(`
        Task {
          "cat2": null,
          "category": undefined,
          "categoryId": 10,
          "id": 1,
          "title": "task 122",
        }
      `)
      await task.save()
      expect(task).toMatchInlineSnapshot(`
        Task {
          "cat2": null,
          "category": undefined,
          "categoryId": 10,
          "id": 1,
          "title": "task 122",
        }
      `)
    }
    await task!.something()
    expect(await serverRemult.repo(Task).findFirst({})).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "categoryId": 10,
        "id": 1,
        "title": "task 122",
      }
    `)
    expect(task).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "id": 1,
        "title": "task 122",
      }
    `)
  })
  it("test how load works when there's no value", async () => {
    const t = await r(Task).insert({ id: 1, title: 'task 1' })
    await Promise.all(t.$.toArray().map((x) => x.load()))
    expect(t).toMatchInlineSnapshot(`
      Task {
        "cat2": null,
        "category": undefined,
        "id": 1,
        "title": "task 1",
      }
    `)
  })
})
