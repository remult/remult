---
type: lesson
title: Sql Relations Filter for User Permissions
template: access-control-2
focus: /shared/TimeEntry.ts
---

### SQL Relations Filter for User Permissions

:::warn
**Experimental Feature:** This API is subject to change in future versions of Remult.
:::

The `sqlRelationsFilter` function provides an efficient way to apply row-level filters across related entities directly within SQL, streamlining access control for related rows. In this lesson, we’ll use `sqlRelationsFilter` to apply permissions based on user access to `Task` entities in the `TimeEntry` entity.

### Defining User Permission Filters

In this example, we want to ensure that users can only access `TimeEntry` rows associated with `Task` entities they have permission to view.

#### TimeEntry Entity Setup

```file:/shared/TimeEntry.ts title="shared/TimeEntry.ts" add={7-8} collapse={11-25}

```

### Explanation of the Code

1. **Using `sqlRelationsFilter`**:

   - The `sqlRelationsFilter` function is designed to apply row-level filtering logic directly within the database.
   - Here, we use it to filter `TimeEntry` rows based on the associated `Task` rows that meet certain user permissions.

2. **Relation-Specific Filtering with `.some()`**:

   - The `.some()` method is used to match `TimeEntry` rows with related `Task` rows that satisfy the filter in `Task.allowedTasks()`.
   - By passing `Task.allowedTasks()` to `.some()`, we enforce permissions on `TimeEntry` rows linked to tasks the user is authorized to view.

3. **Simplified Filtering Logic**:
   - `sqlRelationsFilter` enables us to express complex filtering conditions for related entities with a clear and concise API.
   - This approach is not only efficient but also significantly reduces code complexity by handling filtering at the SQL level.

### Try It Out

1. **Sign in as Different Users**: Test with various users (e.g., users with and without admin roles) to observe how access to `TimeEntry` records changes based on the user’s permissions for related `Task` entities.
2. **Experiment with Permissions**: Modify the `allowedTasks` filter logic in `Task` to see how different rules impact the visibility of `TimeEntry` entries.

By leveraging `sqlRelationsFilter`, you can create highly performant and intuitive access control that directly uses SQL to enforce row-level permissions across related entities.
