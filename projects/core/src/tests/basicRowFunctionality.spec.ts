import { createData } from './createData'
import { DataApi } from '../data-api'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider'
import { MockRestDataProvider } from './testHelper'
import { TestDataApiResponse } from './TestDataApiResponse'
import { Done } from './Done'

import { Status } from './testModel/models'

import { Remult, Allowed } from '../context'
import { __RowsOfDataForTesting } from '../__RowsOfDataForTesting'
import { UrlBuilder } from '../../urlBuilder'

import { SqlDatabase } from '../data-providers/sql-database'

import {
  addFilterToUrlAndReturnTrueIfSuccessful,
  RestDataProvider,
  RestDataProviderHttpProviderUsingFetch,
} from '../data-providers/rest-data-provider'
import {
  entityFilterToJson,
  Filter,
  OrFilter,
} from '../filter/filter-interfaces'
import {
  Categories,
  Categories as newCategories,
  CategoriesForTesting,
} from './remult-3-entities'

import {
  Field,
  decorateColumnSettings,
  Entity,
  EntityBase,
  FieldType,
  Fields,
  getEntityKey,
  isAutoIncrement,
  getEntityRef,
} from '../remult3'

import { CompoundIdField } from '../column'
import { actionInfo } from '../server-action'
import { assign } from '../../assign'
import {
  entityWithValidations,
  testConfiguration,
} from '../shared-tests/entityWithValidations'
import { entityWithValidationsOnColumn } from './entityWithValidationsOnColumn'
import { ValueConverters } from '../valueConverters'
import {
  FilterConsumerBridgeToSqlRequest,
  dbNamesOf,
} from '../filter/filter-consumer-bridge-to-sql-request'
import axios from 'axios'
import {
  HttpProviderBridgeToRestDataProviderHttpProvider,
  retry,
  toPromise,
} from '../buildRestDataProvider'
import { describeClass } from '../remult3/DecoratorReplacer'
import { remult } from '../remult-proxy'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'
import { CompoundIdEntity } from './entities-for-tests'

//SqlDatabase.LogToConsole = true;

@FieldType<Phone>({
  valueConverter: {
    toJson: (x) => x?.thePhone,
    fromJson: (x) => new Phone(x),
  },
})
class Phone {
  constructor(private thePhone) {}
}
@Entity('')
class tableWithPhone extends EntityBase {
  @Fields.integer()
  id: number
  @Field(() => Phone)
  phone: Phone
}
describe('test object column stored as string', () => {
  it('was changed should work correctly', async () => {
    var remult = new Remult(new InMemoryDataProvider())

    let repo = remult.repo(tableWithPhone)
    let r = repo.create()
    r.id = 1
    r.phone = new Phone('123')
    await r.save()
    r.phone = new Phone('123')
    expect(r.$.phone.valueChanged()).toBe(false)
    expect(r._.wasChanged()).toBe(false)
  })
})

describe('Test basic row functionality', () => {
  it('filter on date keeps the type', () => {})
  it('finds its id column', () => {
    let c = new Remult().repo(newCategories)
    expect(c.metadata.idMetadata.field.key).toBe('id')
    let n = c.create()
    n.id = 5
    expect(n._.getId()).toBe(5)
  })
  it('object assign works', () => {
    let a: any = {}
    let b: any = {}
    a.info = 3
    Object.assign(b, a)
    expect(b.info).toBe(3)
  })
  it('Original values update correctly', async () => {
    let c = await (
      await createData(async (insert) => await insert(1, 'noam'))
    )[0].findFirst()
    expect(c.categoryName).toBe('noam')
    expect(c._.fields.categoryName.originalValue).toBe('noam')
    c.categoryName = 'yael'
    expect(c.categoryName).toBe('yael')
    expect(c._.fields.categoryName.originalValue).toBe('noam')
    await c._.save()
    expect(c.categoryName).toBe('yael')
    expect(c._.fields.categoryName.originalValue).toBe('yael')
  })
  it('Find or Create', async () => {
    let [repo] = await await createData()
    let row = await repo.findFirst({ id: 1 }, { createIfNotFound: true })
    expect(row._.isNew()).toBe(true)
    expect(row.id).toBe(1)
    await row._.save()
    let row2 = await repo.findFirst({ id: 1 }, { createIfNotFound: true })
    expect(row2._.isNew()).toBe(false)
    expect(row2.id).toBe(1)
  })
  it('Find or Create id', async () => {
    let [repo] = await await createData()
    let row = await repo.findId(1, { createIfNotFound: true })
    expect(row._.isNew()).toBe(true)
    expect(row.id).toBe(1)
    await row._.save()
    let row2 = await repo.findId(1, { createIfNotFound: true })
    expect(row2._.isNew()).toBe(false)
    expect(row2.id).toBe(1)
  })

  it('object is autonemous', () => {
    let x = new Remult().repo(newCategories).create()
    let y = new Remult().repo(newCategories).create()
    x.categoryName = 'noam'
    y.categoryName = 'yael'
    expect(x.categoryName).toBe('noam')
    expect(y.categoryName).toBe('yael')
  })
  it('find the col value', () => {
    let x = new Remult().repo(newCategories).create()
    let y = new Remult().repo(newCategories).create()
    x.categoryName = 'noam'
    y.categoryName = 'yael'
    expect(y._.fields.find(x._.fields.categoryName.metadata).value).toBe('yael')
    expect(y._.fields.find(x._.fields.categoryName.metadata.key).value).toBe(
      'yael',
    )
    expect(y._.metadata.fields.find('categoryName').key).toBe('categoryName')
  })
  it('can be saved to a pojo', async () => {
    let ctx = new Remult().repo(newCategories)
    let x = ctx.create()
    x.id = 1
    x.categoryName = 'noam'
    let y = x._.toApiJson()
    expect(y.id).toBe(1)
    expect(y.categoryName).toBe('noam')
  })
  // it("json name is important", async () => {
  //   let ctx = new Remult().for(newCategories);
  //   let x = ctx.create();
  //   x.id = 1;
  //   x.categoryName.defs.key = 'xx';
  //   x.categoryName = 'noam';
  //   let y = x._.toApiPojo();;
  //   expect(y.id).toBe(1);
  //   expect(y.xx).toBe('noam');
  // });
  // it("json name is important 1", async () => {
  //   let ctx = new Remult().for_old(myTestEntity);
  //   let x = ctx.create();
  //   x.id.value = 1;
  //   expect(x.name1.defs.key).toBe('name');
  //   x.name1.value = 'noam';
  //   let y = ctx.toApiPojo(x);
  //   expect(y.id).toBe(1);
  //   expect(y.name).toBe('noam', JSON.stringify(y));
  //   y.name = 'yael';
  //   new Remult().for_old(myTestEntity)._updateEntityBasedOnApi(x, y);

  //   expect(x.name1.value).toBe('yael');

  // });
  // it("json name is important", () => {
  //   let x = new myTestEntity();
  //   x.id.value = 1;
  //   x.name1.value = 'a';
  //   var y = new myTestEntity();
  //   expect(x.columns.find(y.name1).value).toBe('a');

  // });
})
@Entity('myTestEntity')
class myTestEntity extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.string({ key: 'name' })
  name1: string
}

describe('data api', () => {
  beforeEach(() =>{ (actionInfo.runningOnServer = true)})
  afterEach(() =>{ (actionInfo.runningOnServer = false)})
  it('get based on id', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam')

      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })

  it('get based on id virtual column', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam')
      expect(data.categoryNameLength).toBe(4)
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it('get based on id virtual column async', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam')
      expect(data.categoryNameLengthAsync).toBe(4)
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })

  it('get based on id can fail', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => d.ok()
    await api.get(t, 2)
    d.test()
  })

  let remult = new Remult()
  remult.dataProvider = new InMemoryDataProvider()

  it('validate with validations on column fails', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    var s = remult.repo(entityWithValidationsOnColumn)
    let c = s.create()

    c.myId = 1
    c.name = 'noam'
    await c._.save()
    c.name = '1'

    expect((await c._.validate()).modelState!.name).toBe('invalid on column')
    c.name = '123'
    expect(await c._.validate()).toBeUndefined()
  })
  it('validation works on non active record', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    var repo = remult.repo(entityWithValidationsOnColumn)
    expect((await repo.validate({ name: '1' })).modelState!.name).toBe(
      'invalid on column',
    )
    expect(await repo.validate({ name: '123' })).toBeUndefined()
    expect(await repo.validate({ name: '1' }, 'myId')).toBeUndefined()
  })
  it('validate with validations on column fails 1', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    var s = remult.repo(entityWithValidationsOnColumn)
    let c = s.create()

    c.myId = 1
    c.name = 'noam'
    await c._.save()
    c.name = '1'
    expect(await c.$.name.validate()).toBe(false)
    c.name = '123'
    const val = await c._.validate()
    expect(val).toBeUndefined()
  })
  it('put with validations on entity fails', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    var s = remult.repo(entityWithValidations)
    let c = s.create()

    c.myId = 1
    c.name = 'noam'
    await c._.save()
    let api = new DataApi(s, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.modelState.name).toBe('invalid')
      d.ok()
    }
    await api.put(t, 1, {
      name: '1',
    })
    d.test()
    var x = await s.find({ where: { myId: 1 } })
    expect(x[0].name).toBe('noam')
  })

  it('delete fails when not found', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => d.ok()
    await api.delete(t, 2)
    d.test()
  })
  it('delete works ', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.deleted = () => d.ok()
    await api.delete(t, 1)

    let r = await c.find()
    expect(r.length).toBe(0)
  })
  it('delete falis nicely ', async () => {
    let ctx = new Remult()
    ctx.dataProvider = {
      getEntityDataProvider: (x) => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }])
        r.delete = () => {
          throw 'ERROR'
        }
        return r
      },
      transaction: undefined,
    }

    var api = new DataApi(ctx.repo(newCategories), ctx)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = () => d.ok()
    await api.delete(t, 1)

    d.test()
  })
  it('post works', async () => {
    let [c, remult] = await createData(async () => {})

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.created = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam')
      d.ok()
    }
    await api.post(t, { id: 1, categoryName: 'noam' })
    d.test()
    expect(await c.count()).toBe(1)
  })
  it('post works for array', async () => {
    let [c, remult] = await createData(async () => {})

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.created = async (data: any) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(1)
      expect(data[0].categoryName).toBe('noam')
      expect(data[1].id).toBe(2)
      expect(data[1].categoryName).toBe('yael')
      d.ok()
    }
    await api.post(t, [
      { id: 1, categoryName: 'noam' },
      { id: 2, categoryName: 'yael' },
    ])
    d.test()
    expect(await c.count()).toBe(2)
  })

  it('post fails on duplicate index', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam')
    })

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = (err) => {
      if (!err.message) fail('no message')
      d.ok()
    }
    await api.post(t, { id: 1, categoryName: 'noam' })
    d.test()
  })

  it('getArray works', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam')
      await i(2, 'yael')
    })

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(1)
      d.ok()
    }
    await api.getArray(t, undefined)
    d.test()
  })
  it('getArray works with filter', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam')
      await i(2, 'yael')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(2)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'id') return '2'
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with filter and multiple values', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam')
      await i(2, 'yael')
      await i(3, 'yoni')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(2)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'id.ne') return ['1', '3']
        return undefined
      },
    })
    d.test()
  })
  it('getArray works with filter and multiple values with closed list columns', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open)
      await i(2, 'yael', undefined, Status.closed)
      await i(3, 'yoni', undefined, Status.hold)
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(1)
      expect(data[0].id).toBe(2)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'status.ne') return ['0', '2']
        return undefined
      },
    })
    d.test()
  })

  it('getArray works with filter and in with closed list columns', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open)
      await i(2, 'yael', undefined, Status.closed)
      await i(3, 'yoni', undefined, Status.hold)
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(2)
      expect(data[1].id).toBe(3)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'status.in') return '[1, 2]'
        return undefined
      },
    })
    d.test()
  })

  it('get array works with filter in body and in array statement', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open)
      await i(2, 'yael', undefined, Status.closed)
      await i(3, 'yoni', undefined, Status.hold)
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(2)
      expect(data[1].id).toBe(3)
      d.ok()
    }
    await api.getArray(
      t,
      {
        get: (x) => {
          return undefined
        },
      },
      {
        'status.in': [1, 2],
      },
    )
    d.test()
  })
  it('get array works with filter in body and or statement', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open)
      await i(2, 'yael', undefined, Status.closed)
      await i(3, 'yoni', undefined, Status.hold)
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(2)
      expect(data[1].id).toBe(3)
      d.ok()
    }
    await api.getArray(
      t,
      {
        get: (x) => {
          return undefined
        },
      },
      {
        OR: [{ status: 1 }, { status: 2 }],
      },
    )
    d.test()
  })

  it('delete with validation fails', async () => {
    var deleting = new Done()
    let happend = false
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiDelete: true,
      deleted: () => (happend = true),
      deleting: (t) => {
        deleting.ok()
        t._.fields.categoryName.error = 'err'
      },
    })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      d.ok()
    }
    await api.delete(t, 1)
    d.test()
    deleting.test()
    expect(happend).toBe(false)
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
  })
  it('delete with validation exception fails', async () => {
    var deleting = new Done()
    let happend = false
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiDelete: true,

      deleted: () => (happend = true),
      deleting: () => {
        deleting.ok()
        throw 'err'
      },
    })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      d.ok()
    }
    await api.delete(t, 1)
    d.test()
    deleting.test()
    expect(happend).toBe(false)
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
  })
  it('delete with validation exception fails - no data api', async () => {
    var deleting = new Done()
    let happend = false
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiDelete: true,
      deleted: () => (happend = true),
      deleting: () => {
        deleting.ok()
        throw 'err'
      },
    })(type)
    let [c] = await createData(async (insert) => await insert(1, 'noam'), type)
    let h2 = false
    let h3 = false
    try {
      await (await c.findId(1))._.delete()
      h2 = true
    } catch {
      h3 = true
    }
    expect(h2).toBe(false)
    expect(h3).toBe(true)
  })
  it('delete works', async () => {
    var deleting = new Done()
    let happend = false
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiDelete: true,
      deleted: (t) => {
        happend = true
        expect(t.id).toBe(1)
      },
      deleting: () => {
        deleting.ok()
      },
    })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )
    expect(c.metadata.apiDeleteAllowed()).toBe(true)
    expect(c.metadata.apiUpdateAllowed()).toBe(true)
    expect(c.metadata.apiInsertAllowed()).toBe(true)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.deleted = async () => {
      d.ok()
    }
    await api.delete(t, 1)
    d.test()
    deleting.test()
    expect(happend).toBe(true)
    var x = await c.find({ where: { id: 1 } })
    expect(x.length).toBe(0)
  })
  it('check api defaults', async () => {
    const c = class {
      id = 0
      name? = ''
    }
    describeClass(c, Entity('asdf'), {
      id: Fields.autoIncrement(),
      name: Fields.string(),
    })
    const repo = new Remult(new InMemoryDataProvider()).repo(c)
    expect(repo.metadata.apiDeleteAllowed()).toBe(false)
    expect(repo.metadata.apiUpdateAllowed()).toBe(false)
    expect(repo.metadata.apiInsertAllowed()).toBe(false)
    expect(repo.metadata.apiDeleteAllowed({ id: 1 })).toBe(false)
    expect(repo.metadata.apiUpdateAllowed({ id: 1 })).toBe(false)
    expect(repo.metadata.apiInsertAllowed({ id: 1 })).toBe(false)
    expect(repo.fields.id.apiUpdateAllowed()).toBe(false)
    expect(repo.fields.id.apiUpdateAllowed({ id: 1 })).toBe(false)
    expect(repo.fields.name.apiUpdateAllowed()).toBe(true)
    expect(repo.fields.name.apiUpdateAllowed({ id: 1 })).toBe(true)
    expect(repo.metadata.apiReadAllowed).toBe(true)
    let x = { id: 1 }
    expect(getEntityRef(x, false)).toBe(undefined)
    repo.metadata.fields.id.displayValue(x)
    repo.metadata.fields.id.apiUpdateAllowed(x)
    repo.metadata.apiDeleteAllowed(x)
    repo.metadata.apiUpdateAllowed(x)
    await repo.validate(x)
    expect(getEntityRef(x, false)).toBeUndefined()
  })

  it('put with validation fails', async () => {
    let count = 0
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiUpdate: true,
      saving: (t) => {
        count++
        if (t.categoryName.includes('1')) t._.fields.categoryName.error = 'err'
      },
    })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      d.ok()
    }
    count = 0
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
    expect(count).toBe(1)
  })

  it('afterSave works', async () => {
    let count = 0
    let startTest = false
    let savedWorked = new Done()
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiUpdate: true,
      saving: () => count++,
      saved: (t) => {
        if (!startTest) return
        savedWorked.ok()
        expect(t._.fields.categoryName.originalValue).toBe('noam')
        expect(t.categoryName).toBe('noam 1')
      },
    })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      d.ok()
    }
    count = 0
    startTest = true
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })

    d.test()
    savedWorked.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam 1')
    expect(count).toBe(1)
  })
  it('afterSave works on insert', async () => {
    let type = class extends newCategories {}
    Entity<typeof type.prototype>(undefined, {
      allowApiUpdate: true,
      allowApiInsert: true,

      saved: (t) => {
        savedWorked.ok()
        expect(t._.isNew()).toBe(true)
        expect(t._.fields.categoryName.originalValue).toBe(undefined)
        expect(t.categoryName).toBe('noam 1')
      },
    })(type)
    let [c, remult] = await createData(async (insert) => {}, type)

    let savedWorked = new Done()

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.created = async (data: any) => {
      d.ok()
    }

    await api.post(t, {
      id: 1,
      categoryName: 'noam 1',
    })

    d.test()
    savedWorked.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam 1')
  })
  it('put with disable save still works', async () => {
    let startTest = false
    let mem = new InMemoryDataProvider()
    remult.dataProvider = mem
    let type = class extends newCategories {}
    Entity<typeof type.prototype>('testE', {
      allowApiUpdate: true,
      saving: (row, cancel) => {
        if (startTest) {
          mem.rows['testE'][0].categoryName = 'kuku'
          expect(mem.rows['testE'][0].categoryName).toBe('kuku')
          cancel()
        }
      },
    })(type)

    {
      let c = remult.repo(type).create()
      c.id = 1
      c.categoryName = 'name'
      c.description = 'noam'
      await c._.save()
    }

    var api = new DataApi(remult.repo(type), remult)
    let t = new TestDataApiResponse()
    let d = new Done()

    t.success = (data) => {
      expect(data.categoryName).toBe('kuku')
      d.ok()
    }
    startTest = true
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })

    d.test()
    var x = await remult.repo(type).find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('kuku')
  })
  it('get based on id with excluded columns', async () => {
    let type = class extends newCategories {
      categoryName: string
    }
    Fields.string({ includeInApi: false })(type.prototype, 'categoryName')
    Entity('')(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe(undefined)

      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it('row reload', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )
    let a = await c.findId(1)
    let b = await c.findId(1, { useCache: false })
    a.categoryName = 'yael'
    await a._.save()
    expect(b.categoryName).toBe('noam')
    await b._.reload()
    expect(b.categoryName).toBe('yael')
    expect(b._.wasChanged()).toBe(false)
    expect(b.$.categoryName.originalValue).toBe('yael')
  })
  it('Find null works', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )
    expect(await c.findId(null)).toBeNull()
    expect(await c.findId(undefined)).toBeNull()
  })

  it('put updates', async () => {
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam 1')
      d.ok()
    }
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam 1')
  })
  it('put updates and readonly columns', async () => {
    let type = class extends newCategories {
      categoryName: string
    }
    Fields.string({ allowApiUpdate: false })(type.prototype, 'categoryName')
    Entity('', { allowApiUpdate: true })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe('noam')
      d.ok()
    }
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
  })
  it('put fails when not found', async () => {
    let [c, remult] = await createData(async (insert) => insert(1, 'noam'))

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.notFound = () => d.ok()
    await api.put(t, 2, {})
    d.test()
  })
  it('put updates', async () => {
    let type = class extends newCategories {
      categoryName: string
    }
    Fields.string({ includeInApi: false })(type.prototype, 'categoryName')
    Entity('', { allowApiUpdate: true })(type)
    let [c, remult] = await createData(
      async (insert) => await insert(1, 'noam'),
      type,
    )
    expect(c.fields.categoryName.includedInApi).toBe(false)
    expect(c.fields.description.includedInApi).toBe(true)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = async (data: any) => {
      expect(data.id).toBe(1)
      expect(data.categoryName).toBe(undefined)
      d.ok()
    }
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
    var x = await c.find({ where: { id: 1 } })
    expect(x[0].categoryName).toBe('noam')
  })
  it('post with syntax error fails well', async () => {
    let type = class extends newCategories {}
    Entity<newCategories>('', {
      allowApiInsert: true,
      saving: (x) => x.description.length + 1,
    })(type)
    let [c, remult] = await createData(async (insert) => {}, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.error = async (data: any) => {
      expect(data.message).toContain('Cannot read prop')
      d.ok()
    }
    await api.post(t, { id: 1, categoryName: 'noam' })
    d.test()
    expect((await c.find()).length).toBe(0)
  })
  it('getArray works with filter contains', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam')
      await i(2, 'yael')
      await i(3, 'yoni')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(1)
      expect(data[1].id).toBe(2)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == c.create()._.fields.categoryName.metadata.key + '.contains')
          return 'a'
        return undefined
      },
    })
    d.test()
  })

  it('getArray works with predefined filter', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(2)
      expect(data[0].id).toBe(1)
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

  it('allow api read depends also on api crud', async () => {
    let sc = new Remult()
    let type = class extends EntityBase {}
    Entity('a', { allowApiCrud: false })(type)
    expect(sc.repo(type).metadata.apiReadAllowed).toBe(false)
  })
  it('allow api read depends also on api crud', async () => {
    let sc = new Remult()
    let type = class extends EntityBase {}
    Entity('a', { allowApiCrud: false, allowApiRead: true })(type)
    expect(sc.repo(type).metadata.apiReadAllowed).toBe(true)
  })

  it('read is not Allowed', async () => {
    let type = class extends newCategories {}
    Entity('', {
      allowApiRead: false,
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'categoryName') return 'a'
        return undefined
      },
    })
    d.test()
  })
  it('get is not Allowed', async () => {
    let type = class extends newCategories {}
    Entity('', {
      allowApiRead: false,
      allowApiCrud: undefined,
      allowApiUpdate: undefined,
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it('count is not Allowed', async () => {
    let type = class extends newCategories {}
    Entity('', {
      allowApiRead: false,
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.count(t, {
      get: (x) => {
        if (x == 'categoryName') return 'a'
        return undefined
      },
    })
    d.test()
  })

  it('delete id  not Allowed', async () => {
    let type = class extends newCategories {}
    Entity('', {
      allowApiDelete: false,
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.delete(t, 2)
    d.test()
  })

  it('apiRequireId', async () => {
    let type = class extends newCategories {}
    Entity('', {
      apiRequireId: true,
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'categoryName') return 'a'
        return undefined
      },
    })
    d.test()

    t = new TestDataApiResponse()
    d = new Done()
    t.success = () => {
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == 'id') return '1'
        return undefined
      },
    })
    d.test()

    t = new TestDataApiResponse()
    d = new Done()
    t.success = () => {
      d.ok()
    }
    await api.get(t, 1)
    d.test()
  })
  it('delete id  not Allowed for specific row', async () => {
    let type = class extends newCategories {}
    Entity<typeof type.prototype>('', {
      allowApiDelete: (t, c) => {
        return t.id == 1
      },
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.delete(t, 2)
    d.test()
    t = new TestDataApiResponse()
    d = new Done()
    t.deleted = () => d.ok()
    await api.delete(t, 1)
    d.test()
  })
  it('update id  not Allowed for specific row', async () => {
    let type = class extends newCategories {}
    Entity<typeof type.prototype>('', {
      allowApiUpdate: (t, c) => {
        return t.id == 1
      },
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.put(t, 2, {
      categoryName: 'noam 1',
    })
    d.test()
    expect(c.metadata.apiUpdateAllowed({ id: 2 } as any)).toBe(false)
    expect(c.metadata.apiUpdateAllowed({ id: 1 } as any)).toBe(true)
    t = new TestDataApiResponse()
    d = new Done()
    t.success = () => d.ok()
    await api.put(t, 1, {
      categoryName: 'noam 1',
    })
    d.test()
  })
  it('insert id  not Allowed for specific row', async () => {
    let type = class extends newCategories {}
    Entity<typeof type.prototype>('', {
      allowApiInsert: (t, c) => {
        return t.categoryName == 'ok'
      },
    })(type)
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a')
      await i(2, 'yael', 'b')
      await i(3, 'yoni', 'a')
    }, type)

    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.forbidden = () => {
      d.ok()
    }
    await api.post(t, {
      categoryName: 'wrong',
    })
    d.test()
    t = new TestDataApiResponse()
    d = new Done()
    t.created = () => d.ok()
    await api.post(t, {
      categoryName: 'ok',
    })
    d.test()
  })

  it('getArray works with sort', async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'a')
      await i(2, 'c')
      await i(3, 'b')
      await i(4, 'c')
    })
    var api = new DataApi(c, remult)
    let t = new TestDataApiResponse()
    let d = new Done()
    t.success = (data) => {
      expect(data.length).toBe(4)
      expect(data[0].id).toBe(1)
      expect(data[1].id).toBe(3)
      expect(data[2].id).toBe(4)
      expect(data[3].id).toBe(2)
      d.ok()
    }
    await api.getArray(t, {
      get: (x) => {
        if (x == '_sort') return 'categoryName,id'
        if (x == '_order') return 'asc,desc'
        return undefined
      },
    })
    d.test()
  })

  it('columnsAreOk', () => {
    let c = new Remult().repo(newCategories).create()
    expect([...c._.fields].length).toBe(6)
    expect(c._.fields.toArray().length).toBe(6)
  })
})
describe('rest call use url get or fallback to post', () => {
  it('should get', () => {
    let url = new UrlBuilder('')
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a: 1 }, url)).toBe(true)
    expect(url.url).toBe('?a=1')
  })
  it('should get 1', () => {
    let url = new UrlBuilder('')
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ 'a.ne': 1 }, url)).toBe(
      true,
    )
    expect(url.url).toBe('?a.ne=1')
  })
  it('should get 2', () => {
    let url = new UrlBuilder('')
    expect(
      addFilterToUrlAndReturnTrueIfSuccessful({ 'a.ne': [1, 2] }, url),
    ).toBe(true)
    expect(url.url).toBe('?a.ne=1&a.ne=2')
  })
  it('should get 3', () => {
    let url = new UrlBuilder('')
    expect(
      addFilterToUrlAndReturnTrueIfSuccessful({ 'a.in': [1, 2] }, url),
    ).toBe(true)
    expect(url.url).toBe('?a.in=%5B1%2C2%5D')
  })
  it('should post ', () => {
    let url = new UrlBuilder('')
    expect(
      addFilterToUrlAndReturnTrueIfSuccessful(
        { 'a.in': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
        url,
      ),
    ).toBe(false)
  })
  it('should post ', () => {
    let url = new UrlBuilder('')
    expect(
      addFilterToUrlAndReturnTrueIfSuccessful(
        { or: [{ a: 1 }, { a: 3 }] },
        url,
      ),
    ).toBe(false)
  })
})
describe('column validation', () => {
  it('validation clears on reset', () => {
    let c = new Remult().repo(newCategories).create()
    expect(c._.hasErrors()).toBe(true)
    c._.fields.id.error = 'x'
    expect(c._.fields.id.error).toBe('x')
    expect(c._.hasErrors()).toBe(false)
    c._.undoChanges()
    expect(c._.fields.id.error).toBe(undefined)
    expect(c._.hasErrors()).toBe(true)
  })
  it('validation clears on change', () => {
    let c = new Remult().repo(newCategories).create()
    expect(c._.hasErrors()).toBe(true)
    c._.fields.id.error = 'x'
    expect(c._.hasErrors()).toBe(false)
    expect(c._.fields.id.error).toBe('x')
    c.id = 1
    //expect(c._.isValid()).toBe(true);
    //expect(c._.columns.id.error).toBe(undefined);
  })

})


describe('compound id', () => {
  it('id field is compound', () => {
    let ctx = new Remult()
    expect(
      ctx.repo(CompoundIdEntity).metadata.idMetadata.field instanceof
        CompoundIdField,
    ).toBe(true)
  })
  it('result id filter works with object', async () => {
    let ctx = new Remult()
    let repo = ctx.repo(CompoundIdEntity)
    let id = repo.metadata.idMetadata.field as CompoundIdField
    var n = await dbNamesOf(repo.metadata)
    let f = new FilterConsumerBridgeToSqlRequest(
      {
        addParameterAndReturnSqlToken: (x) => x,
      },
      n,
    )
    id.resultIdFilter(undefined, repo.create({ a: 1, b: 2 })).__applyToConsumer(
      f,
    )
    expect(await f.resolveWhere()).toBe(' where a = 1 and b = 2')
  })
  it('check is auto increment', async () => {
    let ctx = new Remult()
    let repo = ctx.repo(CompoundIdEntity)
    expect(isAutoIncrement(repo.metadata.idMetadata.field)).toBe(false)
  })
  it('result id filter works with id', async () => {
    let ctx = new Remult()
    let repo = ctx.repo(CompoundIdEntity)
    let id = repo.metadata.idMetadata.field as CompoundIdField
    var n = await dbNamesOf(repo.metadata)
    let f = new FilterConsumerBridgeToSqlRequest(
      {
        addParameterAndReturnSqlToken: (x) => x,
      },
      n,
    )
    id.resultIdFilter('1,2', repo.create({ a: 1, b: 2 })).__applyToConsumer(f)
    expect(await f.resolveWhere()).toBe(' where a = 1 and b = 2')
  })
  it('some things should not work', async () => {
    let ctx = new Remult()
    let repo = ctx.repo(CompoundIdEntity)
    let id = repo.metadata.idMetadata.field as CompoundIdField
    expect(() => id.valueConverter).toThrowError()
    expect(await id.getDbName()).toBe('')
  })

  const ctx = new Remult()
  it('start', async () => {
    let mem = new InMemoryDataProvider()
    let ctx = new Remult()
    ctx.dataProvider = mem

    let s = ctx.repo(CompoundIdEntity)

    mem.rows[s.metadata.key] = [
      { a: 1, b: 11, c: 111 },
      { a: 2, b: 22, c: 222 },
    ]

    var r = await s.find()
    expect(r.length).toBe(2)
    expect(r[0].a).toBe(1)
    expect(r[0]._.getId()).toBe('1,11')
    r = await s.find({ where: s.metadata.idMetadata.getIdFilter('1,11') })

    expect(r.length).toBe(1)
    expect(r[0].a).toBe(1)
  })

  it('update', async () => {
    let mem = new InMemoryDataProvider()
    let ctx = new Remult()
    ctx.dataProvider = mem
    let c = ctx.repo(CompoundIdEntity)
    mem.rows[c.metadata.key] = [
      { a: 1, b: 11, c: 111 },
      { a: 2, b: 22, c: 222 },
    ]

    var r = await c.find()
    expect(r[0].c).toBe(111)
    r[0].c = 55
    expect(r[0]._.fields.c.originalValue).toBe(111)
    let saved = await r[0]._.save()

    expect(r[0].c).toBe(55)

    expect(mem.rows[c.metadata.key][0].c).toBe(55)
    expect(mem.rows[c.metadata.key][0].id).toBe(undefined)
    expect(r[0]._.getId()).toBe('1,11')
  })
  it('update2', async () => {
    let mem = new InMemoryDataProvider()
    let ctx = new Remult()
    ctx.dataProvider = mem
    let c = ctx.repo(CompoundIdEntity)

    mem.rows[c.metadata.key] = [
      { a: 1, b: 11, c: 111 },
      { a: 2, b: 22, c: 222 },
    ]

    var r = await c.find()
    r[0].b = 55
    let saved = await r[0]._.save()

    expect(mem.rows[c.metadata.key][0].b).toBe(55)
    expect(mem.rows[c.metadata.key][0].id).toBe(undefined)

    expect(r[0]._.getId()).toBe('1,55')
  })
  it('insert', async () => {
    let mem = new InMemoryDataProvider()
    let ctx = new Remult()
    ctx.dataProvider = mem
    let c = ctx.repo(CompoundIdEntity).create()
    mem.rows[ctx.repo(CompoundIdEntity).metadata.key].push(
      { a: 1, b: 11, c: 111 },
      { a: 2, b: 22, c: 222 },
    )

    c.a = 3
    c.b = 33
    c.c = 3333
    await c._.save()
    expect(mem.rows[ctx.repo(CompoundIdEntity).metadata.key][2].b).toBe(33)
    expect(mem.rows[ctx.repo(CompoundIdEntity).metadata.key][2].id).toBe(
      undefined,
    )
    expect(c._.getId()).toBe('3,33')
  })
  it('delete', async () => {
    let mem = new InMemoryDataProvider()
    let ctx = new Remult()
    ctx.dataProvider = mem
    let c = ctx.repo(CompoundIdEntity)
    mem.rows[c.metadata.key] = [
      { a: 1, b: 11, c: 111 },
      { a: 2, b: 22, c: 222 },
    ]

    let r = await c.find()
    await r[1]._.delete()
    expect(mem.rows[c.metadata.key].length).toBe(1)
    expect(mem.rows[c.metadata.key][0].a).toBe(1)
  })
})
describe('test data list', () => {
  it('dbname of entity string works', async () => {
    let type = class extends Categories {}
    Entity('testName', { dbName: 'test' })(type)
    let r = new Remult().repo(type)
    expect(await r.metadata.getDbName()).toBe('test')
  })
  it('dbname of entity can use column names', async () => {
    let r = new Remult().repo(EntityWithLateBoundDbName)
    expect(await r.metadata.getDbName()).toBe('(select CategoryID)')
  })
})
describe('test date storage', () => {
  it('works', () => {
    let val = '1976-06-16'
    /** */
    var d: Date = ValueConverters.DateOnly.fromJson(val)
    expect(d.getFullYear()).toBe(1976)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(16)
  })
  it('works', () => {
    let val = new Date(1976, 5, 16)
    expect(ValueConverters.DateOnly.toJson(val)).toBe('1976-06-16')
    //    expect(ValueConverters.DateOnly.displayValue(val)).toBe("6/16/1976");
  })
})
@Entity(undefined)
class myEntity {}
describe('', () => {
  it('dbname of entity string works when key is not defined', async () => {
    let r = new Remult().repo(myEntity)
    expect(await r.metadata.getDbName()).toBe('myEntity')
    expect(r.metadata.key).toBe('myEntity')
    expect(getEntityKey(myEntity)).toBeUndefined()
  })
})
describe('test bool value', () => {
  it('should work', () => {
    let col = decorateColumnSettings<Boolean>(
      { valueType: Boolean },
      new Remult(),
    )
    expect(col.valueConverter.fromJson(true)).toBe(true)
    expect(col.valueConverter.fromJson(false)).toBe(false)
  })
})


describe('cache', () => {
  it('find first useCache', async () => {
    let [r] = await createData(async (i) => i(1, 'noam'))
    await r.findFirst({ id: 1 }, { useCache: true })
    await r.find().then((x) => assign(x[0], { categoryName: 'a' }).save())
    expect((await r.findFirst({ id: 1 })).categoryName).toBe('a')
    expect((await r.findFirst({ id: 1 })).categoryName).toBe('a')
    expect(
      (await r.findFirst({ id: 1 }, { useCache: true })).categoryName,
    ).toBe('noam')
  })
  it('find id', async () => {
    let [r] = await createData(async (i) => i(1, 'noam'))
    await r.findId(1)
    await r.find().then((x) => assign(x[0], { categoryName: 'a' }).save())
    expect((await r.findId(1)).categoryName).toBe('noam')
    expect((await r.findId(1, { useCache: false })).categoryName).toBe('a')
  })
})

describe('test rest data provider translates data correctly', () => {
  it('rest data provider works with update', async () => {
    let [, serverRemult] = await createData(
      async (insert) => await insert(1, 'test'),
    )

    let restDb = new MockRestDataProvider(serverRemult)
    let remult = new Remult()
    remult.dataProvider = restDb
    let c = await remult.repo(Categories).findId(1, { useCache: false })
    expect(c.categoryName).toBe('test')
    c.categoryName = 'test1'
    await c.save()
    expect(c.categoryName).toBe('test1')
    c = await remult.repo(Categories).findId(1, { useCache: false })
    expect(c.categoryName).toBe('test1')
    c.categoryName = undefined
    await c.save()
    expect(c.categoryName).toBeNull()
    c = await remult.repo(Categories).findId(1, { useCache: false })
    expect(c.categoryName).toBeNull()
  })
  it('get works', async () => {
    let type = class extends EntityBase {
      a: number
      b: Date
    }
    Entity('x')(type)
    Fields.integer()(type.prototype, 'a')
    Fields.date()(type.prototype, 'b')

    let c = new Remult().repo(type)
    let z = new RestDataProvider(() => ({
      httpClient: {
        delete: () => undefined,
        get: async () => {
          return [
            {
              a: 1,
              b: '2021-05-16T08:32:19.905Z',
            },
          ]
        },
        post: () => undefined,
        put: () => undefined,
      },
    }))
    let x = z.getEntityDataProvider(c.metadata)
    let r = await x.find()
    expect(r.length).toBe(1)
    expect(r[0].a).toBe(1)
    expect(r[0].b.valueOf()).toBe(
      new Date('2021-05-16T08:32:19.905Z').valueOf(),
    )
    expect(r[0].b instanceof Date).toBe(true)
  })
  it('test api client', async () => {
    let type = class extends EntityBase {
      a: number
      b: Date
    }
    Entity('x')(type)
    Fields.integer()(type.prototype, 'a')
    Fields.date()(type.prototype, 'b')
    let results: string[] = []
    const remult = new Remult()
    let c = remult.repo(type)
    remult.apiClient.httpClient = async (url, args) => {
      results.push('a:' + url)
      return { status: 200, json: async () => [] } as Response
    }
    await c.find()
    expect(results).toEqual(['a:/api/x'])
    results = []
    remult.apiClient.url = '/yy'
    await c.find()
    expect(results).toEqual(['a:/yy/x'])
    results = []
    remult.apiClient.httpClient = async (url, args) => {
      results.push('b:' + url)
      return { status: 200, json: async () => [] } as Response
    }
    await c.find()
    expect(results).toEqual(['b:/yy/x'])
  })
  it('put works', async () => {
    let type = class extends EntityBase {
      a: number
      b: Date
    }
    Entity('x')(type)
    Fields.integer()(type.prototype, 'a')
    Fields.date()(type.prototype, 'b')

    let c = new Remult().repo(type)
    let r = await entityFilterToJson(c.metadata, {
      b: new Date('2021-05-16T08:32:19.905Z'),
    })
    expect(r.b).toBe('2021-05-16T08:32:19.905Z')
  })
  it('put works', async () => {
    let type = class extends EntityBase {
      a: number
      b: Date
    }
    Entity('x')(type)
    Fields.integer()(type.prototype, 'a')
    Fields.date()(type.prototype, 'b')

    let c = new Remult().repo(type)
    let done = new Done()
    let z = new RestDataProvider(() => ({
      httpClient: {
        delete: () => undefined,
        get: () => undefined,
        post: async (x, data) => {
          done.ok()
          expect(data.a).toBe(1)
          expect(data.b).toBe('2021-05-16T08:32:19.905Z')
          return data
        },
        put: () => undefined,
      },
    }))
    let x = z.getEntityDataProvider(c.metadata)
    let r = await x.insert({
      a: 1,
      b: new Date('2021-05-16T08:32:19.905Z'),
    })
    expect(r.a).toBe(1)
    expect(r.b instanceof Date).toBe(true)
    expect(r.b.toISOString()).toBe('2021-05-16T08:32:19.905Z')
    done.test()
  })
})
describe('check allowedDataType', () => {
  let c = new Remult()
  c.dataProvider = new InMemoryDataProvider()
  let strA = 'roleA',
    strB = 'roleB',
    strC = 'roleC'
  let roleA = strA
  let roleB = strB
  let roleC = strC
  beforeAll(async (done) => {
    c.user = { id: 'x', name: 'y', roles: [strA, strB] }
    
  })
  it('1', () => {
    expect(c.isAllowed(strA)).toBe(true)
  })
  function myIt(allowed: Allowed, expected: boolean, description?: string) {
    if (!description && allowed != undefined) description = allowed.toString()
    it(description, () => {
      expect(c.isAllowed(allowed)).toBe(expected)
    })
  }
  myIt(strA, true, 'a')
  myIt(strC, false, 'a')
  myIt([strA], true, 'a')
  myIt([strC], false, 'a')
  myIt([strA], true, 'a')
  myIt([strC, strA], true, 'a')
  myIt([strC, 'strD'], false, 'a')
  myIt(roleA, true)
  myIt(roleC, false)
  myIt([roleA], true)
  myIt([roleC], false)
  myIt([roleC, roleA], true)
  myIt([roleC, 'strD'], false)
  myIt((c) => c.isAllowed(roleA), true)
  myIt(true, true)
  myIt(false, false)
  myIt(undefined, undefined)
  it('no context', () => {
    let c = new Remult()
    c.dataProvider = new InMemoryDataProvider()
    c.user = undefined
    expect(c.isAllowed(true)).toBe(true)
    expect(c.isAllowed((c) => true)).toBe(true)
    expect(c.isAllowed(false)).toBe(false)
    expect(c.isAllowed((c) => false)).toBe(false)
    // expect(c.isAllowed([false, true])).toBe(true);
    // expect(c.isAllowed([false, c => true])).toBe(true);
    // expect(c.isAllowed([false, false])).toBe(false);
    // expect(c.isAllowed([false, c => false])).toBe(false);
    expect(c.isAllowed('abc')).toBe(false)
  })
})
describe('test http retry', () => {
  it('test http retry for proxy', async () => {
    let i = 0

    const r = await retry(async () => {
      if (i++ == 0) throw Error('Error occurred while trying to proxy')
      return 7
    })
    expect(i).toBe(2)
    expect(r).toBe(7)
  })
  it('fails on other errors', async () => {
    let ok = false
    try {
      await retry(async () => {
        throw Error('Another error')
      })
      ok = true
    } catch {}
    expect(ok).toBe(false)
  })
  it('fails on other errors that has no message', async () => {
    let ok = false
    try {
      await retry(async () => {
        throw 'Another error'
      })
      ok = true
    } catch {}
    expect(ok).toBe(false)
  })
})
describe('test toPromise', () => {
  it('handles rxjs style', async () => {
    const r = await toPromise({
      toPromise: async () => 7,
    })
    expect(r).toBe(7)
  })
  it('handles normal promise', async () => {
    const r = await toPromise(new Promise((r) => r(7)))
    expect(r).toBe(7)
  })
  it('handles axios results', async () => {
    const r = await toPromise(
      new Promise((r) =>
        r({
          data: 7,
          headers: {},
          request: {},
          status: 200,
        }),
      ),
    )
    expect(r).toBe(7)
  })
})

@Entity<CompoundIdSimple>('CompoundIdPojoEntity', {
  id: (x) => [x.a, x.b],
})
class CompoundIdSimple {
  @Fields.integer()
  a: number
  @Fields.integer()
  b: number
  @Fields.integer()
  c: number
}
describe('CompoundIdPojoEntity', () => {
  it('test basic operations', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    expect(repo.metadata.idMetadata.getId({ a: 1, b: 10, c: 100 })).toBe('1,10')
  })
  it('test delete by id', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([
      { a: 1, b: 10, c: 100 },
      { a: 2, b: 20, c: 200 },
      { a: 3, b: 30, c: 300 },
    ])
    await repo.delete(repo.metadata.idMetadata.getId({ a: 2, b: 20 }))
    expect((await repo.find()).map((x) => x.a)).toEqual([1, 3])
  })
  it('test delete', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([
      { a: 1, b: 10, c: 100 },
      { a: 2, b: 20, c: 200 },
      { a: 3, b: 30, c: 300 },
    ])
    await repo.delete({ a: 2, b: 20, c: 200 })
    expect((await repo.find()).map((x) => x.a)).toEqual([1, 3])
  })
  it('test delete with partial object', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([
      { a: 1, b: 10, c: 100 },
      { a: 2, b: 20, c: 200 },
      { a: 3, b: 30, c: 300 },
    ])
    await repo.delete({ a: 2, b: 20 })
    expect((await repo.find()).map((x) => x.a)).toEqual([1, 3])
  })
  it('test save', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([
      { a: 1, b: 10, c: 100 },
      { a: 2, b: 20, c: 200 },
      { a: 3, b: 30, c: 300 },
    ])
    await repo.save({ a: 2, b: 20, c: 201 })
    expect((await repo.findFirst({ a: 2, b: 20 })).c).toBe(201)
  })
  it('test update', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([{ a: 2, b: 20, c: 200 }])
    await repo.update(repo.metadata.idMetadata.getId({ a: 2, b: 20 }), {
      c: 201,
    })
    expect((await repo.findFirst({ a: 2, b: 20 })).c).toBe(201)
  })
  it('test update', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([{ a: 2, b: 20, c: 200 }])
    await repo.update(repo.metadata.idMetadata.getId({ a: 2, b: 20 }), {
      c: 201,
    })
    expect((await repo.findFirst({ a: 2, b: 20 })).c).toBe(201)
  })
  it('test update', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([{ a: 2, b: 20, c: 200 }])
    await repo.update({ a: 2, b: 20 }, { c: 201 })
    expect((await repo.findFirst({ a: 2, b: 20 })).c).toBe(201)
  })
  it('test update change of id fields', async () => {
    var repo = new Remult(new InMemoryDataProvider()).repo(CompoundIdSimple)
    await repo.insert([{ a: 2, b: 20, c: 200 }])
    await repo.update(repo.metadata.idMetadata.getId({ a: 2, b: 20 }), {
      b: 21,
    })
    expect((await repo.findFirst({ a: 2 })).b).toBe(21)
  })
})


@Entity<entityWithValidationsOnEntityEvent>('', {
  validation: (t) => {
    if (!t.name || t.name.length < 3) t._.fields.name.error = 'invalid'
  },
})
export class entityWithValidationsOnEntityEvent extends EntityBase {
  @Fields.integer()
  myId: number
  @Fields.string()
  name: string
}
@Entity<EntityWithLateBoundDbName>('stam', {
  sqlExpression: async (t) => '(select ' + t.fields.id.options.dbName + ')',
})
export class EntityWithLateBoundDbName extends EntityBase {
  @Fields.integer({ dbName: 'CategoryID' })
  id: number
}

describe('test fetch', () => {
  it('test remult with non default fetch function', async () => {
    var r = new Remult(
      new RestDataProviderHttpProviderUsingFetch(async (url, info) => {
        return new mockResponse({
          status: 200,
          json: async () => ({ count: 7 }),
        })
      }),
    )
    expect(await r.repo(Categories).count()).toBe(7)
  })
  it('test remult with non default fetch function1', async () => {
    var r = new Remult(async (url, info) => {
      return new mockResponse({ status: 200, json: async () => ({ count: 7 }) })
    })
    expect(await r.repo(Categories).count()).toBe(7)
  })
  it('axios uses the correct api', () => {
    const r = new Remult(axios)
    expect(r.apiClient.httpClient).toBe(axios)
    expect((r.dataProvider as any).apiProvider().httpClient).toBe(axios) //

    expect(
      (
        r.dataProvider.getEntityDataProvider(r.repo(Categories).metadata) as any
      ).http() instanceof HttpProviderBridgeToRestDataProviderHttpProvider,
    ).toBe(true)
  })
  it('get', async () => {
    let z = await new RestDataProviderHttpProviderUsingFetch(
      async (url, info) => {
        return new mockResponse({ status: 200, json: async () => 7 })
      },
    ).get('abc')
    expect(z).toBe(7)
  })
  it('error', async () => {
    try {
      await new RestDataProviderHttpProviderUsingFetch(async (url, info) => {
        return new mockResponse({
          status: 401,
          statusText: 'text',
          url: 'url',
          json: async () => ({}),
        })
      }).get('abc')
    } catch (err) {
      expect(err).toEqual({
        status: 401,
        message: 'text',
        url: 'url',
      })
    }
  })
  it('error4', async () => {
    try {
      await new RestDataProviderHttpProviderUsingFetch(async (url, info) => {
        return new mockResponse({
          status: 401,
          statusText: 'text',
          url: 'url',
          json: async () => {
            throw 'error'
          },
        })
      }).get('abc')
    } catch (err) {
      expect(err).toEqual({
        status: 401,
        message: 'text',
        url: 'url',
      })
    }
  })
  it('error3', async () => {
    try {
      await new RestDataProviderHttpProviderUsingFetch(async (url, info) => {
        return new mockResponse({
          status: 401,
          statusText: 'text',
          url: 'url',
          json: async () => ({ message: 'message' }),
        })
      }).get('abc')
    } catch (err) {
      expect(err).toEqual({
        status: 401,
        url: 'url',
        message: 'message',
      })
    }
  })
  it('error2', async () => {
    try {
      await new RestDataProviderHttpProviderUsingFetch(async (url, info) => {
        throw Promise.resolve('123')
      }).get('abc')
    } catch (err) {
      expect(err).toEqual('123')
    }
  })
  it('post', async () => {
    let z = await new RestDataProviderHttpProviderUsingFetch(
      async (url, info) => {
        return new mockResponse({ status: 200, json: async () => 7 })
      },
    ).post('abc', {})
    expect(z).toBe(7)
  })
  it('put', async () => {
    let z = await new RestDataProviderHttpProviderUsingFetch(
      async (url, info) => {
        return new mockResponse({ status: 200, json: async () => 7 })
      },
    ).put('abc', {})
    expect(z).toBe(7)
  })
  it('delete', async () => {
    let z = await new RestDataProviderHttpProviderUsingFetch(
      async (url, info) => {
        expect(info.headers).toEqual({}) // fastify fails with content type and no body
        return new mockResponse({ status: 204, json: async () => 7 })
      },
    ).delete('abc')
    expect(z).toBeUndefined()
  })
  it("rest doesn't support transactions", async () => {
    const r = new RestDataProvider(() => undefined)
    let ok = false
    try {
      await r.transaction(async () => {})
      ok = true
    } catch {}
    expect(ok).toBe(false)
  })
  it('json field works', async () => {
    const r = new Remult(new InMemoryDataProvider())
    var e = class {
      id: 1
      person: { name: 'noam' }
    }
    describeClass(e, Entity('asdf'), {
      id: Fields.integer(),
      person: Fields.json({
        valueConverter: {
          toJson: (x) => x.name,
          fromJson: (x) => ({ name: x }),
        },
      }),
    })
    expect(r.repo(e).fields.person.valueConverter.toDb({ name: 'noam' })).toBe(
      'noam',
    )
  })
  it('test repo consistent instance', () => {
    let x = remult.repo(Categories)
    let y = remult.repo(Categories)
    expect(x).toBe(y)
  })
})

class mockResponse implements Response {
  constructor(val: Partial<Response>) {
    Object.assign(this, val)
  }
  headers: Headers
  ok: boolean
  redirected: boolean
  status: number
  statusText: string
  type: ResponseType
  url: string
  clone(): Response {
    throw new Error('Method not implemented.')
  }
  body: ReadableStream<Uint8Array>
  bodyUsed: boolean
  readonly trailer: Promise<Headers>
  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.')
  }
  blob(): Promise<Blob> {
    throw new Error('Method not implemented.')
  }
  formData(): Promise<FormData> {
    throw new Error('Method not implemented.')
  }
  json(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  text(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
