import { describe, expect, it } from 'vitest'
import { Entity } from '../core/src/remult3/entity.js'
import { stam } from './dbs/shared-tests/db-tests.js'
import { tasks } from './tests/tasks.js'
import { Remult } from '../core/src/context.js'
import { InMemoryDataProvider } from '../core/src/data-providers/in-memory-database.js'

describe('select', () => {
  function createEntity(stam: any) {
    const r = new Remult()
    r.dataProvider = new InMemoryDataProvider()
    return r.repo(stam)
  }

  it('should get id', async () => {
    const repo = await createEntity(stam)
    await repo.insert({ id: 1, title: 'noam' })
    const result = await repo.find({
      select: {
        id: true,
      },
    })
    expect(result).toMatchInlineSnapshot(`
      [
        stam {
          "id": 1,
        },
      ]
    `)
  })
  it('should get id only with title false', async () => {
    const repo = await createEntity(stam)
    await repo.insert({ id: 1, title: 'noam' })
    const maybeTitle = false as boolean
    const result = await repo.find({
      select: {
        id: true,
        title: maybeTitle,
      },
    })
    expect(result).toMatchInlineSnapshot(`
      [
        stam {
          "id": 1,
        },
      ]
    `)
  })
  it('should get id only with title undefined', async () => {
    const repo = await createEntity(stam)
    await repo.insert({ id: 1, title: 'noam' })
    const maybeTitle = undefined as boolean | undefined
    const result = await repo.find({
      select: {
        id: true,
        title: maybeTitle,
      },
    })
    expect(result).toMatchInlineSnapshot(`
      [
        stam {
          "id": 1,
        },
      ]
    `)
  })
  it('should get everything as select is not provided', async () => {
    const repo = await createEntity(stam)
    await repo.insert({ id: 1, title: 'noam' })
    const result = await repo.find({})
    expect(result).toMatchInlineSnapshot(`
      [
        stam {
          "id": 1,
          "title": "noam",
        },
      ]
    `)
  })
  it('should get nothing as there is no select', async () => {
    const repo = await createEntity(stam)
    await repo.insert({ id: 1, title: 'noam' })
    const result = await repo.find({ select: {} })
    expect(result).toMatchInlineSnapshot(`
      [
        stam {},
      ]
    `)
  })
  // add a relation test (task & category)
})
