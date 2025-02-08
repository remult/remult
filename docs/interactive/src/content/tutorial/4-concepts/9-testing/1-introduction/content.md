---
type: lesson
title: Introduction to Testing with Remult
focus: /tests/validations.test.ts
---

---

# Introduction to Testing with Remult

Remult makes it simple to replace your production database with a test database, enabling you to easily write and execute automated tests. The flexibility of switching between databases allows you to verify logic, validations, and even SQL-related functionality in your entities, streamlining the testing process for development.

## Code Example: Basic Validation Tests

The example below sets up tests for the `Task` entity to check basic validation logic:

```file:/tests/validations.test.ts title="tests/validations.test.ts" add={8} collapse={1-5,10-100}

```

### Code Explanation

1. **Setting the Data Provider for Tests**:

   - Inside the `beforeEach` hook, the test database is set to `InMemoryDataProvider`, allowing for fast, transient data access without needing a real database connection.

2. **Test Cases**:
   - **Task with Title**: This test creates a task with a title and verifies that the task count increases by one.
   - **Task without Title**: This test attempts to insert a task without a title, triggering a validation error. The `expect(error.message)` statement then verifies the validation message.

### Try It Out

Click the `Toggle Terminal` button on the right to see the test execution and validation output.

---

## Testing SQL-Based Logic

For testing SQL expressions or SQL-based filters, use an in-memory SQLite database, which supports SQL functionality without needing a production database connection.

```solution:/tests/validations.test.ts title="tests/validations.test.ts" collapse={1-6,13-100} add={8-10}

```

### Explanation of SQL Test Setup

- **createSqlite3DataProvider**: Sets an SQLite database in memory, enabling tests for SQL-related code.
- **ensureSchema**: This ensures that the table structure matches your entity metadata, automatically creating tables as needed.
- **SqlDatabase.LogToConsole**: Setting this to `true` outputs SQL statements to the console, helping verify that SQL operations are working as expected.

### Using Your Actual Database Provider

In addition to in-memory testing, you can test with your actual database provider by setting it to `remult.dataProvider`, ensuring compatibility and performance for production scenarios.

---

By using these techniques, you can write comprehensive tests covering all entity aspects, from validations to SQL expressions.
