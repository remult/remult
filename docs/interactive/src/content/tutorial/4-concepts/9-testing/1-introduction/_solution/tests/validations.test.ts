import { describe, test, expect, beforeEach } from 'vitest'
import { remult, repo, InMemoryDataProvider, SqlDatabase } from 'remult'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'
import { Task } from '../shared/Task'

describe('Test validations', () => {
  beforeEach(async () => {
    remult.dataProvider = await createSqlite3DataProvider()
    // makes sure the table exists in the database
    await remult.dataProvider.ensureSchema?.([repo(Task).metadata])
    //  SqlDatabase.LogToConsole = true
  })
  test('Task with title', async () => {
    await repo(Task).insert({ title: 'Task 1' })
    expect(await repo(Task).count()).toBe(1)
  })
  test('Task without title', async () => {
    await expect(() => repo(Task).insert({})).rejects.toThrowError(
      'Title: Should not be empty',
    )
  })
})
