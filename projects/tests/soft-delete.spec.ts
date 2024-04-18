import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createEntity } from './tests/dynamic-classes'
import { Entity, Fields, InMemoryDataProvider, Remult, remult } from '../core'
describe('soft delete', async () => {
  let repo = remult.repo
  beforeEach(() => {
    repo = new Remult(new InMemoryDataProvider()).repo
  })
  it('test delete', async () => {
    @Entity('tasks', {
      deleting: async (t, e) => {
        e.preventDefault()
        await e.repository.update(t, { deleted: true })
      },
      backendPreprocessFilter: async (filter, { getFilterPreciseValues }) => {
        if (!(await getFilterPreciseValues(filter)).deleted) {
          return { ...filter, deleted: false }
        }
        return filter
      },
    })
    class Task {
      @Fields.integer()
      id = 0
      @Fields.boolean()
      deleted = false
    }

    const r = repo(Task)
    await r.insert({ id: 1 })
    expect(await r.count()).toBe(1)
    await r.delete(1)
    expect(await r.count()).toBe(0)
    expect(await r.count({ deleted: true })).toBe(1)
  })
})
