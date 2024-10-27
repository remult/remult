---
type: lesson
title: Testing Api Rules
focus: /tests/validations.test.ts
---

# Testing API Rules

In Remult, automated tests run as if they are executing directly on the backend. This can make it challenging to test API rules, which typically involve permissions and access control that rely on simulating API calls. To address this, you can use the `TestApiDataProvider`, which simulates an API environment for each database operation in your tests.

### Code Example: Authorization Tests with `TestApiDataProvider`

The example below demonstrates how to test API rules, including user authentication and authorization, using `TestApiDataProvider`:

```file:/tests/authorization.test.ts title="tests/authorization.test.ts" collapse={1-6,19-100} add={9-17}

```

### Code Explanation

1. **Test Setup with `beforeEach`**:

   - A test database is created using `createSqlite3DataProvider`, and `ensureSchema` verifies that the necessary tables exist.
   - Initial data, such as a task titled "my task," is inserted into the database as if on the backend.
   - The `TestApiDataProvider` is then set as the active data provider, wrapping the SQLite database and ensuring each operation simulates an API call.

2. **Testing API Rules**:
   - Each test simulates different user scenarios to verify the `delete` permission on tasks:
     - **Non-Authenticated Users**: If `remult.user` is set to `undefined`, the test verifies that unauthenticated users cannot delete tasks.
     - **Non-Admin Users**: With `remult.user` set to an authenticated but non-admin user, the test expects a `Forbidden` error when attempting deletion.
     - **Admin Users**: An authenticated admin user should have deletion access, and the test confirms that the task count decreases accordingly.

### Testing SQL-Related Logic

For SQL-based tests, you can use the `SqlDatabase.LogToConsole = true` setting to see SQL queries and understand the underlying operations during tests.

---

Using these techniques allows you to simulate real API operations within tests, ensuring robust access control and proper handling of user permissions in your application.
