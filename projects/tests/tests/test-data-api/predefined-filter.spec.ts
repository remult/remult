import { createData } from '../createData'
import { Done } from '../Done'
import { TestDataApiRequest, TestDataApiResponse } from '../TestDataApiResponse'

import { DataApi } from '../../../core/src/data-api'

import { beforeEach, describe, expect, it } from 'vitest'
import { Remult } from '../../../core/src/context'
import { Filter } from '../../../core/src/filter/filter-interfaces'
import {
  Entity,
  Entity as EntityDecorator,
  EntityFilter,
  Fields,
  InMemoryDataProvider,
} from '../../../core'
import { Categories as newCategories } from '../remult-3-entities'
import { testAsIfOnBackend } from '../testHelper'

describe('data api', () => {
  let remult = new Remult()
  it('getArray works with predefined filter', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(2)

      d.ok()
    }
    await api.getArray(t, undefined!)
    d.test()
  })
  it('get works with predefined filter', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.id).toBe(2)

      d.ok()
    }
    await api.get(t, 2)
    d.test()
  })
  it('get id  works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => {
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it('delete id  works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => {
      d.ok()
    }
    await api.delete(t, 1)
    d.test()
  })
  it('delete id  works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.deleted = () => {
      d.ok()
    }
    await api.delete(t, 2)
    d.test()
  })
  it('put id  works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = () => {
      d.ok()
    }
    await api.put(t, new TestDataApiRequest(), 2, { name: 'YAEL' })
    d.test()
  })
  it('put id 1 works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => {
      d.ok()
    }
    await api.put(t, new TestDataApiRequest(), 1, { name: 'YAEL' })
    d.test()
  })
  it('put id 1 works with predefined filterand shouldnt return anything', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest2)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => {
      d.ok()
    }
    await api.put(t, new TestDataApiRequest(), 1, { name: 'YAEL' })
    d.test()
  })
  it('getArray works with predefined filter', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(0)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == c.create()._.fields.description.metadata.key) return 'a'
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter1 ', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter 2', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest2)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter 3', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest3)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter 3 inherit', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest3Inherit)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter 4', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTest4)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with predefined filter and inheritance', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, CategoriesForThisTestThatInherits)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)

      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        return undefined
      },
    })
    d.test()
  })

  it('works with predefined Entity Filter', async () => {
    let [c] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    })
    expect((await c.findFirst({ id: 1 }))!.categoryName).toBe('noam')
    expect((await c.findId(1))!.categoryName).toBe('noam')
  })
})

describe('test backend filter and update', () => {
  @Entity('t', { allowApiCrud: true, backendPrefilter: () => backendFilter })
  class t {
    @Fields.integer()
    id!: number
    @Fields.string()
    name!: string
  }
  var remult = new Remult()
  let backendFilter: EntityFilter<t> = {}
  let r = remult.repo(t)
  beforeEach(async () => {
    backendFilter = {}
    remult = new Remult(new InMemoryDataProvider())
    r = remult.repo(t)
    await remult.repo(t).insert([
      { id: 1, name: 'noam' },
      { id: 2, name: 'yael' },
      { id: 3, name: 'yoni' },
    ])
  })

  it('works', async () => {
    expect(await remult.repo(t).count()).toBe(3)
    backendFilter = { id: [1, 3] }
    expect(await remult.repo(t).count()).toBe(2)
  })
  it('update fails', async () => {
    backendFilter = { id: 1 }
    await expect(() => r.update(2, { name: 'z' })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 404,
        "message": "id 2 not found in entity t",
      }
    `)
    expect(await r.findId(2)).toBeUndefined()
    backendFilter = {}
    expect(await r.findId(2)).toMatchInlineSnapshot(`
      t {
        "id": 2,
        "name": "yael",
      }
    `)
  })
  it('update fails 2', async () => {
    await r.delete(2)
    await expect(() => r.update(2, { name: 'z' })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 404,
        "message": "id 2 not found in entity t",
      }
    `)
  })
  it('save fails 2', async () => {
    const item = await r.findId(2)
    await r.delete(2)
    item!.name = 'z'
    await expect(() =>
      r.save(item!),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: ArrayEntityDataProvider: Couldn't find row with id "2" in entity "t" to update]`,
    )
  })
  it('save fails', async () => {
    backendFilter = { id: 1 }
    await expect(() => r.save({ id: 2, name: 'z' })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 404,
        "message": "id 2 not found in entity t",
      }
    `)
    backendFilter = {}
    expect(await r.findId(2)).toMatchInlineSnapshot(`
        t {
          "id": 2,
          "name": "yael",
        }
      `)
  })
  it('delete fails', async () => {
    backendFilter = { id: 1 }
    await expect(() => r.delete({ id: 2 })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 404,
        "message": "id 2 not found in entity t",
      }
    `)
    backendFilter = {}
    expect(await r.findId(2)).toMatchInlineSnapshot(`
        t {
          "id": 2,
          "name": "yael",
        }
      `)
  })
  it('delete fails', async () => {
    backendFilter = { id: 1 }
    await expect(() => r.delete(2)).rejects.toThrowErrorMatchingInlineSnapshot(`
      {
        "httpStatusCode": 404,
        "message": "id 2 not found in entity t",
      }
    `)
    backendFilter = {}
    expect(await r.findId(2)).toMatchInlineSnapshot(`
        t {
          "id": 2,
          "name": "yael",
        }
      `)
  })
})

@EntityDecorator<stam1>('categories', {
  backendPrefilter: { description: 'b' },
})
class stam1 extends newCategories {}
describe('', () => {
  it('works with predefined Entity Filter', async () => {
    testAsIfOnBackend(async () => {
      let [c] = await createData(async (i) => {
        await i(1, 'noam', 'a')
        await i(2, 'yael', 'b')
        await i(3, 'yoni', 'a')
      }, stam1)
      let r = await c.find()
      expect(r.length).to.eq(1, 'array length')
      expect(r[0].id).to.eq(2, 'value of first row')
      expect(await c.count()).to.eq(1, 'count')
      expect(await c.findFirst({ id: 1 })).to.eq(undefined, 'find first')
      expect(
        (await c.findFirst({ id: 1 }, { createIfNotFound: true }))!._.isNew(),
      ).to.eq(true, 'lookup ')
    })
  })
})
@EntityDecorator<stam1>('categories', {
  backendPrefilter: async () => ({ description: 'b' }),
})
class stam2 extends newCategories {}
describe('', () => {
  it('works with predefined Entity Filter lambda', async () => {
    await testAsIfOnBackend(async () => {
      let [c] = await createData(async (i) => {
        await i(1, 'noam', 'a')
        await i(2, 'yael', 'b')
        await i(3, 'yoni', 'a')
      }, stam2)
      let r = await c.find()
      expect(r.length).to.eq(1, 'array length')
      expect(r[0].id).to.eq(2, 'value of first row')
      expect(await c.count()).to.eq(1, 'count')
      expect(await c.findFirst({ id: 1 })).to.eq(undefined, 'find first')
      expect(
        (await c.findFirst({ id: 1 }, { createIfNotFound: true }))!._.isNew(),
      ).to.eq(true, 'lookup ')
    })
  })
})
@EntityDecorator<stam1>('categories', {
  backendPrefilter: async () => ({ description: 'b' }),
})
class stam3 extends newCategories {}
it('backend filter only works on backend', async () => {
  let [c, remult] = await createData(async (i) => {
    await i(1, 'noam', 'a')
    await i(2, 'yael', 'b')
    await i(3, 'yoni', 'a')
  }, stam3)
  remult.dataProvider.isProxy = true
  let r = await c.find()
  expect(r.length).to.eq(3, 'array length')
  expect(await c.count()).to.eq(3, 'count')
  remult.dataProvider.isProxy = false
  expect(await c.count()).to.eq(1, 'count')
  expect(await c.findFirst({ id: 1 })).to.eq(undefined, 'find first')
  expect(
    (await c.findFirst({ id: 1 }, { createIfNotFound: true }))!._.isNew(),
  ).to.eq(true, 'lookup ')
})

@EntityDecorator<CategoriesForThisTest>(undefined!, {
  allowApiUpdate: true,
  allowApiDelete: true,
  apiPrefilter: { description: 'b' },
})
class CategoriesForThisTest extends newCategories {}
@EntityDecorator<CategoriesForThisTest>(undefined!, {
  allowApiUpdate: true,
  allowApiDelete: true,
  apiPrefilter: () => ({ description: 'b' }),
})
class CategoriesForThisTest2 extends newCategories {}
@EntityDecorator<CategoriesForThisTestThatInherits>(undefined!, {
  backendPrefilter: () => ({ categoryName: { $contains: 'a' } }),
})
class CategoriesForThisTestThatInherits extends CategoriesForThisTest2 {}

@EntityDecorator<CategoriesForThisTest3>(undefined!, {
  allowApiUpdate: true,
  allowApiDelete: true,
  apiPrefilter: CategoriesForThisTest3.myFilter(),
})
class CategoriesForThisTest3 extends newCategories {
  static myFilter = Filter.createCustom<CategoriesForThisTest3>(
    async (remult) => ({ description: 'b' }),
    'key',
  )
}
@EntityDecorator<CategoriesForThisTest3Inherit>(undefined!, {})
class CategoriesForThisTest3Inherit extends CategoriesForThisTest3 {}
@EntityDecorator<CategoriesForThisTest4>(undefined!, {
  allowApiUpdate: true,
  allowApiDelete: true,
  apiPrefilter: () => CategoriesForThisTest4.myFilter(),
})
class CategoriesForThisTest4 extends newCategories {
  static myFilter = Filter.createCustom<CategoriesForThisTest4>(
    async (remult) => ({ description: 'b' }),
  )
}
