import { ActionTestConfig, testRestDb } from './testHelper'
import { TestDataApiResponse } from './TestDataApiResponse'
import { Remult, isBackend } from '../context'
import { actionInfo, BackendMethod } from '../server-action'
import {
  Field,
  Entity,
  EntityBase,
  getFields,
  getEntityRef,
  EntityFilter,
  Fields,
} from '../remult3'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { DataApi } from '../data-api'

import { assign } from '../../assign'
import { dWithPrefilter } from './dWithPrefilter'
import { d } from './d'
import { remult } from '../remult-proxy'
import { describeClass } from '../remult3/DecoratorReplacer'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

@Entity('testServerMethodOnEntity')
class testServerMethodOnEntity extends EntityBase {
  constructor(private remult: Remult) {
    super()
  }
  @Fields.string<testServerMethodOnEntity>({
    validate: (y, x) => {
      if (y.a == 'errorc') {
        x.error = 'error on client'
      } else if (y.a == 'error on server' && isBackend()) {
        x.error = 'error on server'
      }
    },
  })
  a: string
  @BackendMethod({ allowed: true })
  async doIt1() {
    let result = 'hello ' + this.a
    this.a = 'yael'
    return {
      onServer: isBackend(),
      result,
    }
  }
  async doIt1NoDecorator() {
    let result = 'hello ' + this.a
    this.a = 'yael'
    return {
      onServer: isBackend(),
      result,
    }
  }
  @BackendMethod({ allowed: true })
  async doItAgain() {
    expect(await this.remult.repo(testServerMethodOnEntity).count()).toBe(0)
    await this._.save()
    expect(await this.remult.repo(testServerMethodOnEntity).count()).toBe(1)
    return (await this.remult.repo(testServerMethodOnEntity).findFirst()).a
  }
}
describeClass(testServerMethodOnEntity, undefined, {
  doIt1NoDecorator: BackendMethod({ allowed: true, paramTypes: [Remult] }),
})

@Entity<testBoolCreate123>('testBoolCreate123', (o, c) =>
  assign(o, {
    allowApiCrud: true,
    saving: async (t) => {
      if (isBackend() && t._.isNew()) {
        await c.repo(testBoolCreate123).count()
        await new Promise((res, rej) =>
          setTimeout(() => {
            res({})
          }, 20),
        )
        t.ok123 = true
      }
    },
  }),
)
class testBoolCreate123 extends EntityBase {
  @Fields.number()
  id: number
  @Fields.boolean({})
  ok123: Boolean = false
  @BackendMethod({ allowed: true })
  async testIt() {
    await this._.save()
  }
}
describe('test Server method in entity', () => {
  let c = new Remult()
  it('test server method on Entity', async () => {
    let x = c.repo(testServerMethodOnEntity).create()
    x.a = 'Noam'
    let r = await x.doIt1()
    expect(r.onServer).toBe(true)
    expect(r.result).toBe('hello Noam')
    expect(x.a).toBe('yael')
  })
  it('test server method on Entity without decorator', async () => {
    let x = c.repo(testServerMethodOnEntity).create()
    x.a = 'Noam'
    let r = await x.doIt1NoDecorator()
    expect(r.onServer).toBe(true)
    expect(r.result).toBe('hello Noam')
    expect(x.a).toBe('yael')
  })
  it('test server method on Entity', async () => {
    let x = c.repo(testServerMethodOnEntity).create()
    x.a = 'Noam'
    expect(await x.doItAgain()).toBe('Noam')
  })
  it('test validation method', async () => {
    let x = c.repo(testServerMethodOnEntity).create()
    x.a = 'errorc'
    let happened = false
    try {
      let r = await x.doIt1()
      happened = true
    } catch (err) {
      expect(err.modelState.a).toBe('error on client')
      expect(getEntityRef(x).fields.a.error).toBe('error on client')
    }
    expect(happened).toBe(false)
  })
  it('test backend method with adhoc entity', async () => {
    const myClass = class {
      id = 0
      name = ''

      async doSomething() {
        return this.name + isBackend()
      }
    }

    describeClass(myClass, Entity('adHocEntity'), {
      id: Fields.autoIncrement(),
      name: Fields.string(),
      doSomething: BackendMethod({ allowed: true }),
    })
    const x = new Remult().repo(myClass).create()
    x.name = '123'
    expect(await x.doSomething()).toBe('123true')
  })
  it('test static backend method with adhoc entity', async () => {
    const myClass = class {
      id = 0
      name = ''

      static async adHockDoSomething() {
        return isBackend()
      }
    }
    describeClass(
      myClass,
      Entity('adHocEntity'),
      {
        id: Fields.autoIncrement(),
        name: Fields.string(),
      },
      {
        adHockDoSomething: BackendMethod({ allowed: true }),
      },
    )
    expect(await myClass.adHockDoSomething()).toBe(true)
  })

  it('test validation on server', async () => {
    let x = c.repo(testServerMethodOnEntity).create()
    x.a = 'error on server'
    let happened = false
    try {
      let r = await x.doIt1()
      happened = true
    } catch (err) {
      expect(err.modelState.a).toBe('error on server')
      expect(getEntityRef(x).fields.a.error).toBe('error on server')
    }
    expect(happened).toBe(false)
  })
  it('saves correctly to db', async () => {
    actionInfo.runningOnServer = true
    let remult = new Remult()
    remult.dataProvider = new InMemoryDataProvider()
    let r = remult.repo(testBoolCreate123)
    let dataApi = new DataApi(r, remult)
    let t = new TestDataApiResponse()
    t.created = (x) => {
      expect(x.ok123).toBe(true)
    }

    await dataApi.post(t, { id: 1, ok123: false })
    t.success = (x) => {
      expect(x.ok123).toBe(false)
    }
    await dataApi.put(t, 1, { ok123: false })
    actionInfo.runningOnServer = false
  })
})

@Entity('a')
class a extends EntityBase {
  @Fields.integer()
  id: number
}
@Entity('b')
class b extends EntityBase {
  @Fields.integer()
  id: number
  @Field(() => a)
  a: a
}
@Entity('c')
class c extends EntityBase {
  @Fields.integer()
  id: number
  @Field(() => b)
  b: b
  @BackendMethod({ allowed: true })
  async doIt() {
    expect(this.b.id).toBe(11)
    expect(this.b.a.id).toBe(1)
    this.b = await this.remult.repo(b).findId(12)
    expect(this.b.id).toBe(12)
    expect(this.b.a.id).toBe(2)
    await this.save()
    return this.b.a.id
  }
  @BackendMethod({ allowed: true })
  async doIt2() {
    expect(this.b.id).toBe(12)
    expect(this.b.a.id).toBe(2)
    await this.save()
    return this.b.a.id
  }
  constructor(private remult: Remult) {
    super()
  }
}

describe('complex entity relations on server entity and backend method', () => {
  beforeEach(() => {
    ActionTestConfig.db.rows = []
  })
  it('fix it', async () => {
    let remult = new Remult()
    remult.dataProvider = ActionTestConfig.db
    let a1 = await remult.repo(a).create({ id: 1 }).save()
    let a2 = await remult.repo(a).create({ id: 2 }).save()
    let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save()
    let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save()
    let c1 = await remult.repo(c).create({ id: 21, b: b1 }).save()
    remult = new Remult() //clear the cache;
    remult.dataProvider = ActionTestConfig.db

    let r = await c1.doIt()
    expect(r).toBe(2)
    expect(c1.b.id).toBe(12)
    expect(c1.b.a.id).toBe(2)
  })
  it('fix it new row', async () => {
    let remult = new Remult()
    remult.dataProvider = ActionTestConfig.db
    let a1 = await remult.repo(a).create({ id: 1 }).save()
    let a2 = await remult.repo(a).create({ id: 2 }).save()
    let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save()
    let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save()

    remult = new Remult() //clear the cache;
    remult.dataProvider = ActionTestConfig.db
    let c1 = await remult.repo(c).create({ id: 21, b: b1 })
    let r = await c1.doIt()
    expect(r).toBe(2)
    expect(c1.b.id).toBe(12)
    expect(c1.b.a.id).toBe(2)
  })
  it('fix it change value', async () => {
    let remult = new Remult()
    remult.dataProvider = ActionTestConfig.db
    let a1 = await remult.repo(a).create({ id: 1 }).save()
    let a2 = await remult.repo(a).create({ id: 2 }).save()
    let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save()
    let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save()
    let c1 = await remult.repo(c).create({ id: 21, b: b1 }).save()
    remult = new Remult() //clear the cache;
    remult.dataProvider = ActionTestConfig.db
    c1 = await remult.repo(c).findId(21)
    c1.b = b2
    let r = await c1.doIt2()
    expect(r).toBe(2)
    expect(c1.b.id).toBe(12)
    expect(c1.b.a.id).toBe(2)
  })
})

it('test that entity backend method respects api filter', async () => {
  let remult = new Remult(ActionTestConfig.db)
  let repo = remult.repo(dWithPrefilter)
  await repo.query().forEach((x) => x.delete())
  let d1 = await repo.create({ id: 1, b: 1 }).save()
  await repo.create({ id: 2, b: 1 }).save()
  await repo.create({ id: 3, b: 2 }).save()
  let d4 = await repo.create({ id: 4, b: 2 }).save()
  dWithPrefilter.count = 0
  expect(await d4.doIt()).toBe(true)
  expect(dWithPrefilter.count).toBe(1)
  dWithPrefilter.count = 0
  let error = false
  try {
    await d1.doIt()
  } catch {
    error = true
  }
  expect(error).toBe(true)
  expect(dWithPrefilter.count).toBe(0)
})
it('test api filter cant be overwritten', async () => {
  return testRestDb(async ({ remult }) => {
    let repo = remult.repo(dWithPrefilter)
    let d1 = await repo.create({ id: 1, b: 1 }).save()
    await repo.create({ id: 3, b: 2 }).save()
    let d4 = await repo.create({ id: 4, b: 2 }).save()
    expect(await repo.count({ b: 1 })).toBe(0)
    expect((await repo.find({ where: { b: 1 } })).length).toBe(0)
  })
})
