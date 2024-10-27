import { describe, test, expect, beforeEach } from 'vitest'
import { remult, repo, InMemoryDataProvider, SqlDatabase } from 'remult'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'
import { Task } from '../shared/Task'

describe('Test validations', () => {
  beforeEach(async () => {
    remult.dataProvider = new InMemoryDataProvider()
  })
  test('Task with title', async () => {
    await repo(Task).insert({ title: 'Task 1' })
    expect(await repo(Task).count()).toBe(1)
  })
  test('Task without title', async () => {
    try {
      await repo(Task).insert({})
      throw new Error('Should not reach here')
    } catch (error: any) {
      expect(error.message).toBe('Title: Should not be empty')
    }
  })
})
