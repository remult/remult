---
type: lesson
title: Row-Level Authorization
template: access-control
focus: /shared/Task.ts
---

# Row-Level Authorization

Row-level authorization enables control over specific rows of an entity based on user roles, ownership, or custom logic. This feature is essential for applications that need fine-grained permissions.

Consider the following example:

```file:/shared/Task.ts title="shared/Task.ts" collapse={13-30} add={4-8}

```

### Understanding Each Authorization Option

1. **`allowApiRead: true`**

   - `allowApiRead` controls whether rows are accessible for reading through the API, and it defaults to `true`, unlike other options that default to `false`.
   - Although you cannot use an arrow function with `allowApiRead` to restrict specific rows, this can be achieved using row-level filters, which we’ll cover in the next lesson, **"Filtering Rows Based on User Permissions"**.

2. **`allowApiInsert: remult.authenticated`**

   - Restricts the ability to create new tasks to authenticated users. Any user who is not logged in will be denied insert access.

3. **`allowApiDelete: 'admin'`**

   - Limits deletion of tasks to users with the `admin` role, preventing other users from deleting tasks through the API.

4. **`allowApiUpdate` with Conditional Logic**
   - The `allowApiUpdate` option here uses an arrow function to set conditional update access based on role and ownership:
     ```typescript
     allowApiUpdate: (task) =>
       remult.isAllowed('admin') || task.ownerId === remult.user?.id,
     ```
   - This configuration allows:
     - Admin users to update any task, and
     - Non-admin users to update only their own tasks, identified by matching `task.ownerId` to the current user’s ID.
   - Such logic provides flexibility for controlling access at a granular level, aligning permissions with both general access and specific ownership.

### Versatility Across Options

Each of these options—`allowApiRead`, `allowApiInsert`, `allowApiDelete`, and `allowApiUpdate`—can accept different inputs to define permissions:

- **Boolean values** (`true` or `false`) for universal access or denial.
- **Role strings** or arrays of roles (e.g., `'admin'` or `['admin', 'manager']`) for access control based on user roles.
- **Arrow functions** for `allowApiInsert`, `allowApiDelete`, and `allowApiUpdate`, providing custom logic based on roles, user IDs, or specific row attributes.

In the upcoming lesson, **"Filtering Rows Based on User Permissions"**, we’ll explore how to apply row-level access control dynamically, allowing each user to view only the rows they are permitted to access using specific filters.
