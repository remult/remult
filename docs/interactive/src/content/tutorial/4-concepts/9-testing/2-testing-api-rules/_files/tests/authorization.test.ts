import { describe, test, expect, beforeEach } from 'vitest'
import { remult, repo, InMemoryDataProvider } from 'remult'
import { TestApiDataProvider } from 'remult/server'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'
import { Task } from '../shared/Task'

describe('Test authorization', () => {
  beforeEach(async () => {
    const dataProvider = await createSqlite3DataProvider()
    await dataProvider.ensureSchema?.([repo(Task).metadata])
    remult.dataProvider = dataProvider
    // Insert rows directly into the database as if on the backend
    await repo(Task).insert({ title: 'my task' })
    // Configure the test API data provider
    remult.dataProvider = TestApiDataProvider({
      dataProvider,
    })
  })

  test('non-authenticated users cannot delete', async () => {
    try {
      remult.user = undefined // Simulate unauthenticated user
      const task = await repo(Task).findFirst()
      await repo(Task).delete(task)
      throw new Error('Should not reach here')
    } catch (error: any) {
      expect(error.message).toBe('Forbidden')
    }
  })

  test('Non-admin users cannot delete', async () => {
    try {
      remult.user = { id: '1' } // Simulate authenticated non-admin user
      const task = await repo(Task).findFirst()
      await repo(Task).delete(task)
      throw new Error('Should not reach here')
    } catch (error: any) {
      expect(error.message).toBe('Forbidden')
    }
  })

  test('Admin users can delete', async () => {
    remult.user = { id: '1', roles: ['admin'] } // Simulate authenticated admin user
    const task = await repo(Task).findFirst()
    await repo(Task).delete(task)
    expect(await repo(Task).count()).toBe(0)
  })
})
