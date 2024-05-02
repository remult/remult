import { it, expect, describe, beforeAll, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
} from '../../core/index.js'

describe('test-types.spec.ts', () => {
  let remult = new Remult()
  beforeEach(() => {
    remult = new Remult(new InMemoryDataProvider())
  })
  it('test basic something', async () => {
    type Status = 'open' | 'closed'
    @Entity('tasks')
    class test {
      @Fields.integer()
      id = 0
      @Fields.string()
      type: Status | null = null
    }
    const repo = remult.repo(test)
    await repo.insert({ type: 'open' })
    await repo.count({
      type: ['closed', null],
    })
  })
})
