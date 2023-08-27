import { TestDataApiResponse } from './TestDataApiResponse'
import { Done } from './Done'
import { Remult } from '../context'

import { JsonDataProvider } from '../data-providers/json-data-provider'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'

import { DataApi } from '../data-api'

import { Categories as newCategories } from './remult-3-entities'
import { Field, Entity, EntityBase, Fields, IdEntity } from '../remult3'
import { tasks } from './tasks'
import { deleteAll } from '../shared-tests/deleteAll'
import { describe, it, expect } from 'vitest'

describe('test tasks', () => {
  it('test tasks', async () => {
    let storage = ''
    let db = new JsonDataProvider({
      getItem: () => storage,
      setItem: (x, y) => (storage = y),
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
