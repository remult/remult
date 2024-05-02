import { Entity, EntityBase, Field, Fields } from '../../core'
import { Remult, isBackend } from '../../core/src/context'
import { BackendMethod } from '../../core/src/server-action'
import { ActionTestConfig, testRestDb } from './testHelper'

import { assign } from '../../core/assign'
import { dWithPrefilter } from './dWithPrefilter'

import { beforeEach, describe, expect, it } from 'vitest'
import { describeClass } from '../../core/src/remult3/classDescribers'

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
