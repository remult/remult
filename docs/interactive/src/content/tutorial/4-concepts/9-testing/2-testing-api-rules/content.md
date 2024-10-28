---
type: lesson
title: Testing Api Rules
focus: /tests/authorization.test.ts
---

# Testing API Rules

In Remult, automated tests run as if they are executing directly on the backend. This can make it challenging to test API rules, which typically involve permissions and access control that rely on simulating API calls. To address this, you can use the `TestApiDataProvider`, which simulates an API environment for each database operation in your tests.

### Code Example: Authorization Tests with `TestApiDataProvider`

The example below demonstrates how to test API rules, including user authentication and authorization, using `TestApiDataProvider`:

```file:/tests/authorization.test.ts title="tests/authorization.test.ts" collapse={1-6,19-100} add={9-12}
import { describe, test, expect, beforeEach } from 'vitest'
import { remult, repo, InMemoryDataProvider } from 'remult'
import { TestApiDataProvider } from 'remult/server'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'
import { Task } from '../shared/Task'

describe('Test authorization', () => {
  beforeEach(async () => {
    remult.dataProvider = TestApiDataProvider({
      dataProvider: createSqlite3DataProvider(),
    })
    await repo(Task).insert({ title: 'my task' })
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

```

### Code Explanation

1. **Test Setup with `beforeEach`**:

   - we set up the test environment to use `TestApiDataProvider`, simulating an API call for each database operation.
   - We also create an initial task in the database to test authorization logic on existing data.

2. **Testing API Rules**:
   - Each test simulates different user scenarios to verify the `delete` permission on tasks:
     - **Non-Authenticated Users**: If `remult.user` is set to `undefined`, the test verifies that unauthenticated users cannot delete tasks.
     - **Non-Admin Users**: With `remult.user` set to an authenticated but non-admin user, the test expects a `Forbidden` error when attempting deletion.
     - **Admin Users**: An authenticated admin user should have deletion access, and the test confirms that the task count decreases accordingly.

### Testing SQL-Related Logic

For SQL-based tests, you can use the `SqlDatabase.LogToConsole = true` setting to see SQL queries and understand the underlying operations during tests.

---

Using these techniques allows you to simulate real API operations within tests, ensuring robust access control and proper handling of user permissions in your application.
