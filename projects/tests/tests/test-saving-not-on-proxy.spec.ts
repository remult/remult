import { it, expect, describe } from 'vitest'
import { entity } from './dynamic-classes'
import { Fields, InMemoryDataProvider, Remult } from '../../core'
import { MockRestDataProvider } from './testHelper'
import { TestApiDataProvider } from '../../core/server/test-api-data-provider.js'

describe('test saving happens only no db', () => {
  it('saving runs when close to db', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    let events: string[] = []
    const Task = entity(
      't',
      {
        id: Fields.integer(),
      },
      {
        validation: () => events.push('validation'),
        saving: () => events.push('saving'),
        saved: () => events.push('saved'),
        deleted: () => events.push('deleted'),
        deleting: () => events.push('deleting'),
      },
    )
    const t = await remult.repo(Task).insert({ id: 1 })
    expect(events).toMatchInlineSnapshot(`
      [
        "validation",
        "saving",
        "saved",
      ]
    `)
    events = []
    await remult.repo(Task).delete(t)
    expect(events).toMatchInlineSnapshot(`
      [
        "deleting",
        "deleted",
      ]
    `)
  })
  it('saving doesnt run with proxy', async () => {
    let serverRemult = new Remult()
    serverRemult.dataProvider = new InMemoryDataProvider()
    const db = TestApiDataProvider({ dataProvider: serverRemult.dataProvider })
    const remult = new Remult(db)
    let events: string[] = []
    const Task = entity(
      't',
      {
        id: Fields.integer(),
      },
      {
        allowApiCrud: true,
        validation: () => events.push('validation'),
        saving: () => events.push('saving'),
        saved: () => events.push('saved'),
        deleted: () => events.push('deleted'),
        deleting: () => events.push('deleting'),
      },
    )
    const t = await remult.repo(Task).insert({ id: 1 })
    expect(events).toMatchInlineSnapshot(`
      [
        "validation",
        "validation",
        "saving",
        "saved",
      ]
    `)
    events = []
    await remult.repo(Task).delete(t)
    expect(events).toMatchInlineSnapshot(`
      [
        "deleting",
        "deleted",
      ]
    `)
  })
})
