import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  getEntityRef,
} from '../../../../core'
import { describe, it, expect, beforeEach } from 'vitest'
import type { ClassType } from '../../../../core/classType'
import { entityFilterToJson } from '../../../../core/src/filter/filter-interfaces'

@Entity<Category>('categories', {
  id: {
    company: true,
    id: true,
  },
})
class Category {
  @Fields.integer()
  company = 0
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
  @Fields.string()
  categoryId = ''
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
      [1, 2, 3].map((y) => ({ id: y, name: 'cat' + y, company: y + 10 })),
    )
    await repo(Task).insert({
      id: 1,
      title: 'task1',
      categoryId: getEntityRef(cat1).getId().toString(),
    })
  })
  it('test derived many', async () => {
    expect(
      (await repo(Category).find({ include: { tasks: true } })).map(
        (y) => y.tasks!.length,
      ),
    ).toEqual([1, 0, 0])
  })

  it('test id', async () => {
    expect(getEntityRef(cat1).getId().toString()).toBe('11,1')
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
        expect(t.categoryId).toBe('12,2')
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
    expect((await getEntityRef(t).save()).categoryId).toBe('12,2')
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
        expect(t.categoryId).toBe('12,2')
        expect(t.category?.name).toBe('cat2')
        expect(t.category.id).toBe(2)
      })
  })
  it('test repo update', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).update(1, { category: cat2 })).categoryId).toBe(
      '12,2',
    )
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
        expect(t.categoryId).toBe('12,2')
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo save', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).save({ ...t, category: cat2 })).categoryId).toBe(
      '12,2',
    )
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
        expect(t.categoryId).toBe('12,2')
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo update b', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).update(1, { title: 'tt' })).categoryId).toBe(
      '11,1',
    )
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
        expect(t.categoryId).toBe('11,1')
        expect(t.category?.name).toBe('cat1')
      })
  })
  it('test repo save b', async () => {
    let t = await repo(Task).findFirst()
    expect((await repo(Task).save({ ...t, title: 'tt' })).categoryId).toBe(
      '11,1',
    )
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
        expect(t.categoryId).toBe('11,1')
        expect(t.category?.name).toBe('cat1')
      })
  })
  it('test repo update c', async () => {
    let t = await repo(Task).findFirst()
    t.category = cat2
    expect(
      (
        await repo(Task).update(1, {
          categoryId: getEntityRef(cat3).getId().toString(),
          category: cat2,
        })
      ).categoryId,
    ).toBe('12,2')
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
        expect(t.categoryId).toBe('12,2')
        expect(t.category?.name).toBe('cat2')
      })
  })
  it('test repo save c', async () => {
    let t = await repo(Task).findFirst()
    t.category = cat2
    expect(
      (
        await repo(Task).save({
          ...t,
          categoryId: getEntityRef(cat3).getId().toString(),
          category: cat2,
        })
      ).categoryId,
    ).toBe('12,2')
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
        expect(t.categoryId).toBe('12,2')
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
        "categoryId": "12,2",
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
          "12,2",
          "13,3",
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
        "categoryId": "12,2",
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
        "categoryId.ne": "12,2",
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
          "12,2",
          "13,3",
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
})
//[ ] http://localhost:5173/api/dealContacts?contactId=007c1297-6a54-45c2-b0aa-d6b9e41adf13&contactId=007c1297-6a54-45c2-b0aa-d6b9e41adf13
//[ ] - load shouldnt reach the data provider, limit and page shouldn't be Nan
