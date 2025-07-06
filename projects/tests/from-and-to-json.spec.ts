import { beforeEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Field,
  Fields,
  InMemoryDataProvider,
  Remult,
  ValueListFieldType,
  describeClass,
} from '../core'

@ValueListFieldType()
class status {
  static ok = new status()
  static notOk = new status()
  id!: string
}

@Entity('categories')
class Category {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  name = ''
}

@Entity('tasks')
class Task {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  title = ''
  @Fields.dateOnly()
  dateOnly = new Date(2016, 6, 6, 5)
  @Fields.date()
  date = new Date(2016, 6, 6, 5)
  @Fields.string({ includeInApi: false })
  shouldNotSee = ''
  @Field(() => status)
  status = status.ok
  @Field(() => Category)
  category?: Category
}

describe('Test sync from and to json', () => {
  let remult = new Remult(new InMemoryDataProvider())
  let category: Category
  let task1: Task
  let task2: Task
  let repo = remult.repo(Task)
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
    repo = remult.repo(Task)

    category = {
      id: 1,
      name: 'testCat',
    }
    task1 = {
      id: 1,
      title: 'test',
      date: new Date('2020-07-03T01:00:00.000Z'),
      dateOnly: new Date('2020-07-03T01:00:00.000Z'),
      shouldNotSee: 'secret',
      status: status.notOk,
      category: category,
    }
    task2 = {
      id: 2,
      title: 'test2',
      date: new Date('2022-07-03T01:00:00.000Z'),
      dateOnly: new Date('2022-07-03T01:00:00.000Z'),
      shouldNotSee: 'secret',
      status: status.ok,
      category: category,
    }
  })

  it('test that it works', () => {
    let theJson = repo.toJson(task1)

    let forTest = { ...theJson }
    delete forTest.date
    expect(forTest).toMatchInlineSnapshot(
      `
      {
        "category": {
          "id": 1,
          "name": "testCat",
        },
        "dateOnly": "2020-07-03",
        "id": 1,
        "status": "notOk",
        "title": "test",
      }
    `,
    )
    let t = repo.fromJson(theJson)
    expect(t.date.getFullYear()).toBe(2020)
    expect(t.dateOnly.getFullYear()).toBe(2020)
    delete (t as any).date
    delete (t as any).dateOnly
    expect(t).toMatchInlineSnapshot(
      `
      Task {
        "category": Category {
          "id": 1,
          "name": "testCat",
        },
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
          "label": "Not Ok",
        },
        "title": "test",
      }
    `,
    )
  })
  it('test without loading it works', async () => {
    await remult.repo(Category).insert(category)
    await repo.insert(task1)
    remult.clearAllCache()
    const tasks = await repo.find({ load: (x) => [x.title] })
    delete (tasks[0] as any).date
    delete (tasks[0] as any).dateOnly
    expect(tasks).toMatchInlineSnapshot(`
        [
          Task {
            "category": undefined,
            "id": 1,
            "shouldNotSee": "secret",
            "status": status {
              "caption": "Not Ok",
              "id": "notOk",
              "label": "Not Ok",
            },
            "title": "test",
          },
        ]
      `)
  })
  it('test with loading it works', async () => {
    await remult.repo(Category).insert(category)
    await repo.insert(task1)
    remult.clearAllCache()
    const tasks = await repo.find({ load: (x) => [x.category!] })
    delete (tasks[0] as any).date
    delete (tasks[0] as any).dateOnly
    expect(tasks).toMatchInlineSnapshot(`
      [
        Task {
          "category": Category {
            "id": 1,
            "name": "testCat",
          },
          "id": 1,
          "shouldNotSee": "secret",
          "status": status {
            "caption": "Not Ok",
            "id": "notOk",
            "label": "Not Ok",
          },
          "title": "test",
        },
      ]
    `)
  })
  it('test category', () => {
    const t = { ...task1 }
    const ref = repo.getEntityRef(t)
    expect(ref.fields.category!.value?.name).toBe('testCat')
  })
  it('test with null category', () => {
    const t = { ...task1, category: null! }
    const r = repo.fromJson(repo.toJson(t))
    delete (r as any).date
    delete (r as any).dateOnly
    expect(r).toMatchInlineSnapshot(`
      Task {
        "category": null,
        "id": 1,
        "shouldNotSee": "",
        "status": status {
          "caption": "Not Ok",
          "id": "notOk",
          "label": "Not Ok",
        },
        "title": "test",
      }
    `)
  })
  it('works with array', () => {
    const r = repo.toJson([task1, task2])
    expect(r.length).toBe(2)
    const rr = repo.fromJson(r)
    expect(rr.length).toBe(2)
  })
  it('works with lazy', async () => {
    const cat = await remult.repo(Category).insert(category)
    const c = class {
      id = ''
      name = ''
      cat?: Category
    }
    describeClass(c, Entity('cc'), {
      id: Fields.string(),
      name: Fields.string(),
      cat: Field(() => Category, { lazy: true }),
    })
    const repo = remult.repo(c)
    await repo.insert({ id: '1', name: '11', cat: category })
    remult.clearAllCache()
    expect(repo.toJson(await repo.find())).toMatchInlineSnapshot(`
      [
        {
          "cat": undefined,
          "id": "1",
          "name": "11",
        },
      ]
    `)
  })
  it('works with lazy two', async () => {
    const cat = await remult.repo(Category).insert(category)
    const c = class {
      id = ''
      name = ''
      cat?: Category
    }
    describeClass(c, Entity('cc'), {
      id: Fields.string(),
      name: Fields.string(),
      cat: Field(() => Category, { lazy: true }),
    })
    const repo = remult.repo(c)
    await repo.insert({ id: '1', name: '11', cat: category })
    remult.clearAllCache()
    expect(await repo.toJson(repo.find())).toMatchInlineSnapshot(`
      [
        {
          "cat": undefined,
          "id": "1",
          "name": "11",
        },
      ]
    `)
  })
})
