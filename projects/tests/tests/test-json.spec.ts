import { Remult } from '../../core/src/context'
import { Done } from './Done'
import { TestDataApiResponse } from './TestDataApiResponse'

import { JsonDataProvider } from '../../core/src//data-providers/json-data-provider'

import { DataApi } from '../../core/src//data-api'

import { describe, expect, it, test } from 'vitest'
import { tasks } from './tasks'
import { entity } from './dynamic-classes'
import { Fields } from '../../core'

describe('test tasks', () => {
  it('test tasks', async () => {
    let storage = ''
    let db = new JsonDataProvider({
      getItem: () => storage,
      setItem: (x, y) => {
        storage = y
      },
    })
    let cont = new Remult()
    cont.dataProvider = db
    let c = cont.repo(tasks)
    let t = c.create()
    t.id = 1
    await t._.save()
    t = c.create()
    t.id = 2
    t.completed = true
    await t._.save()
    t = c.create()
    t.id = 3
    t.completed = true
    await t._.save()

    expect(await c.count({ completed: { $ne: true } })).toBe(1)
    expect(await c.count({ completed: true })).toBe(2)
    expect(await c.count({ completed: false })).toBe(1)
    var api = new DataApi(c, cont)
    let tr = new TestDataApiResponse()
    let d = new Done()
    tr.success = async (data) => {
      d.ok()
      expect(data.length).toBe(1)
    }
    await api.getArray(tr, {
      get: (x) => {
        if (x == 'completed.ne') return 'true'
        return undefined
      },
    })
    d.test()
  })
})
test('test raw json', async () => {
  let storage: any = null
  let db = new JsonDataProvider({
    getItem: () => storage,
    setItem: (x, y) => {
      storage = y
    },
    supportsRawJson: true,
  })
  var r = new Remult(db)
  var c = r.repo(tasks)
  await c.insert({ id: 1, completed: true })
  expect(storage).toMatchInlineSnapshot(`
    [
      {
        "completed": true,
        "id": 1,
        "name": "",
      },
    ]
  `)
  expect(await c.find()).toMatchInlineSnapshot(`
    [
      tasks {
        "completed": true,
        "id": 1,
        "name": "",
      },
    ]
  `)
})

it('test data api response fails on wrong answer', () => {
  var r = new TestDataApiResponse()
  r.progress(0.5)
  expect(() => r.created({})).toThrowError()
  expect(() => r.deleted()).toThrowError()
  expect(() => r.error({})).toThrowError()
  expect(() => r.forbidden()).toThrowError()
  expect(() => r.notFound()).toThrowError()
  expect(() => r.success({})).toThrowError()
})

describe('Test json formatting', () => {
  const t = entity('t', {
    id: Fields.string(),
  })
  it('not formatted', async () => {
    const r = new Remult(
      new JsonDataProvider(
        {
          getItem(entityDbName) {
            return ''
          },
          setItem(entityDbName, json) {
            expect(json).toMatchInlineSnapshot(`"[{"id":"1"}]"`)
          },
        },
        false,
      ),
    )
    await r.repo(t).insert({ id: '1' })
  })
  it('formatted', async () => {
    const r = new Remult(
      new JsonDataProvider(
        {
          getItem(entityDbName) {
            return ''
          },
          setItem(entityDbName, json) {
            expect(json).toMatchInlineSnapshot(`
              "[
                {
                  "id": "1"
                }
              ]"
            `)
          },
        },
        true,
      ),
    )
    await r.repo(t).insert({ id: '1' })
  })
})
