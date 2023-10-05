import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  Sort,
  describeClass,
  getEntityRef,
} from '../../../../core'
import { describe, it, expect, beforeEach } from 'vitest'
import type { ClassType } from '../../../../core/classType'
import { entityFilterToJson } from '../../../../core/src/filter/filter-interfaces'
import { createEntity } from '../../dynamic-classes'

@Entity('categories')
class Category {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
  @Relations.toMany(() => Task)
  tasks?: Task[]
}
@Entity('task')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.integer()
  categoryId = 0
  @Relations.toOne<Task, Category>(() => Category, 'categoryId')
  category?: Category
}

describe('test one', () => {
  let remult: Remult
  let cat1: Category
  let cat2: Category
  let cat3: Category
  function repo<T>(x: ClassType<T>) {
    return remult.repo(x)
  }
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    ;[cat1, cat2, cat3] = await repo(Category).insert(
      [1, 2, 3].map((y) => ({ id: y, name: 'cat' + y })),
    )
    await repo(Task).insert({ id: 1, title: 'task1', categoryId: 1 })
  })
  it('test derived many', async () => {
    expect(
      (await repo(Category).find({ include: { tasks: true } })).map(
        (y) => y.tasks!.length,
      ),
    ).toEqual([1, 0, 0])
  })
  it('test insert', async () => {
    await repo(Task).insert({ id: 2, category: cat2 })

    await repo(Task)
      .findFirst(
        { id: 2 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
    expect(
      (
        await repo(Task).find({
          where: {
            category: cat2,
          },
        })
      ).map((y) => y.id),
    ).toEqual([2])
  })
  it('test update', async () => {
    let t = await repo(Task).findFirst()
    t.category = cat2
    expect((await getEntityRef(t).save()).categoryId).toBe(2)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo update', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).update(1, { category: cat2 })).categoryId).toBe(2)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo save', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).save({ ...t, category: cat2 })).categoryId).toBe(2)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo update b', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).update(1, { title: 'tt' })).categoryId).toBe(1)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(1)
        expect(t.category?.name).toBe('cat1')
      })
  })
  it('test repo save b', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).save({ ...t, title: 'tt' })).categoryId).toBe(1)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(1)
        expect(t.category?.name).toBe('cat1')
      })
  })
  it('test repo update c', async () => {
    let t = await repo(Task).findFirst()
    t.category = cat2
    expect(
      (await repo(Task).update(1, { categoryId: 3, category: cat2 }))
        .categoryId,
    ).toBe(2)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo save c', async () => {
    let t = await repo(Task).findFirst()
    t.category = cat2
    expect(
      (await repo(Task).save({ ...t, categoryId: 3, category: cat2 }))
        .categoryId,
    ).toBe(2)
    await repo(Task)
      .findFirst(
        { id: 1 },
        {
          include: {
            category: true,
          },
        },
      )
      .then((t) => {
        expect(t.categoryId).toBe(2)
        expect(t.category?.name).toBe('cat2')
      })
  })

  it('test filter equal to json', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: cat2,
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId": 2,
      }
    `)
  })
  it('test filter in to json', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: [cat2, cat3],
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId.in": [
          2,
          3,
        ],
      }
    `)
  })
  it('test filter in to json c', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: [undefined],
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId.in": [
          null,
        ],
      }
    `)
  })
  it('test filter in to json b', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: [cat2],
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId": 2,
      }
    `)
  })
  it('test filter in to json b', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        id: [2],
      }),
    ).toMatchInlineSnapshot(`
      {
        "id": 2,
      }
    `)
  })

  it('test filter not equal to json', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: { $ne: cat2 },
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId.ne": 2,
      }
    `)
  })
  it('test filter not equal i to json', async () => {
    expect(
      entityFilterToJson(repo(Task).metadata, {
        category: { $ne: [cat2, cat3] },
      }),
    ).toMatchInlineSnapshot(`
      {
        "categoryId.ne": [
          2,
          3,
        ],
      }
    `)
  })
  it('test filter', async () => {
    remult.dataProvider = new InMemoryDataProvider()
    for (const cat of [cat1, cat2, cat3]) {
      for (let index = 0; index < cat.id; index++) {
        await repo(Task).insert({
          category: cat,
          id: cat.id * 100 + index + 1,
          title: 'cat ' + cat.id + ' task ' + (index + 1),
        })
      }
    }
    const r = repo(Task)
    expect(await r.count()).toBe(6)
    expect(await r.count({ category: cat2 })).toBe(2)
    expect(await r.count({ category: [cat1, cat3] })).toBe(4)
    expect(await r.count({ category: { '!=': cat1 } })).toBe(5)
    expect(await r.count({ category: { '!=': [cat1, cat3] } })).toBe(2)
  })
  it('test sort', async () => {
    expect(
      Sort.translateOrderByToSort(repo(Task).metadata, {
        category: 'desc',
      }).Segments.map((s) => ({ key: s.field.key, desc: s.isDescending })),
    ).toMatchInlineSnapshot(`
      [
        {
          "desc": true,
          "key": "categoryId",
        },
      ]
    `)
  })
  it('test more than one relation', async () => {
    const User = class {
      id = 0
      name = ''
      createdTasks?: Task[]
      updatedTasks?: Task[]
    }
    //[ ] v1.5 - would be nice to support relations in `createClass` syntax
    describeClass(User, Entity('user1'), {
      id: Fields.integer(),
      name: Fields.string(),
      createdTasks: Relations.toMany(() => Task1),
      updatedTasks: Relations.toMany(() => Task1, 'updateUser'),
    })
    const Task1 = class {
      id = 0
      title = ''
      createUser: InstanceType<typeof User>
      updateUser: InstanceType<typeof User>
    }
    describeClass(Task1, Entity('task1'), {
      id: Fields.integer(),
      title: Fields.string(),
      createUser: Relations.toOne(() => User),
      updateUser: Relations.toOne(() => User),
    })
    const [u1, u2] = await repo(User).insert(
      [1, 2].map((x) => ({ id: x, name: 'user ' + x })),
    )
    const t = await repo(Task1).insert({
      id: 11,
      title: '',
      createUser: u1,
      updateUser: u2,
    })

    expect(
      await repo(User)
        .find({
          include: {
            createdTasks: true,
            updatedTasks: true,
          },
        })
        .then((x) =>
          x.map((u) => ({
            user: u.id,
            created: u.createdTasks.map((t) => t.id),
            updated: u.updatedTasks.map((t) => t.id),
          })),
        ),
    ).toMatchInlineSnapshot(`
      [
        {
          "created": [
            11,
          ],
          "updated": [],
          "user": 1,
        },
        {
          "created": [],
          "updated": [
            11,
          ],
          "user": 2,
        },
      ]
    `)
  })
  it('test api of to one', async () => {
    Relations.toOne(() => Category, {
      dbName: '',
      defaultIncluded: true,
    })
    Relations.toOne(() => Category, {
      field: 'asdf',
      defaultIncluded: true,
    })
  })
})

//p1 http://localhost:5173/api/dealContacts?contactId=007c1297-6a54-45c2-b0aa-d6b9e41adf13&contactId=007c1297-6a54-45c2-b0aa-d6b9e41adf13
//p1 load shouldnt reach the data provider, limit and page shouldn't be Nan
//p1 check types errors in hagai familydeliveries
//p1 to json with remult proxy repo gave an error!
//p1 rethink with yoni if relations should place it's options in the field options - there may by naming conflicts with users extending options
//p1 reconsider split reference & one for overload clarity
//p1 check field options of to many - to make sure that it's saving gets an array
