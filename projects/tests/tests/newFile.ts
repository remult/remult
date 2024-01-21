import { DataApi } from '../../core/src//data-api'
import { InMemoryDataProvider } from '../../core/src//data-providers/in-memory-database'
import { Entity, EntityBase, Fields, getEntityRef } from '../../core'
import { Remult, isBackend } from '../../core/src/context'
import { BackendMethod } from '../../core/src/server-action'
import { TestDataApiResponse } from './TestDataApiResponse'
import { describe, expect, it } from 'vitest'
import { describeClass } from '../../core/src//remult3/DecoratorReplacer'
import {
  testServerMethodOnEntity,
  testBoolCreate123,
} from './test-server-method-on-entity.spec'

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
  it('test instance backend method insert with allowApiUpdate=false', async () => {
    class Task extends EntityBase {
      id = 0
      title = ''
      async doAndSave() {
        this.title = 'done'
        await this.save()
        return true
      }
    }
    describeClass(Task, Entity('tttt'), {
      id: Fields.autoIncrement(),
      title: Fields.string(),
      doAndSave: BackendMethod({ allowed: true }),
    })
    const t = new Remult().repo(Task).create({ title: '255' })
    await t.doAndSave()
    expect(t).toMatchInlineSnapshot(`
      Task {
        "id": 1,
        "title": "done",
      }
    `)
  })
})
