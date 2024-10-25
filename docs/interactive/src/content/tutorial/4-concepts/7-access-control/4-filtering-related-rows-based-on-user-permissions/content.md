---
type: lesson
title: Filtering Related Rows Based on User Permissions
template: access-control-2
focus: /shared/TimeEntry.ts
---

# Filtering Related Rows Based on User Permissions

In this lesson, we’ll explore how to apply user-based access controls to related rows in your data model. Specifically, we’ll filter the `TimeEntry` API to ensure that only entries for tasks the user is allowed to view are accessible. This involves reusing the `apiPrefilter` logic from the `Task` entity and applying it to related entities like `TimeEntry`.

## Step 1: Refactor `apiPrefilter` into a Custom Filter

First, we’ll refactor the `apiPrefilter` logic in `Task` into a reusable custom filter. This allows us to apply the same filtering logic in multiple places, ensuring consistency.

### Task Entity

In `Task`, we define a static custom filter, `allowedTasks`, which checks the user's role:

```file:/shared/Task.ts title="shared/Task.ts" {4} add={23-28} collapse={8-21}

```

### Explanation of the Code

- **`allowedTasks` Custom Filter**: This filter uses `remult.isAllowed` to check if the user has the `admin` role. Admins can access all tasks, while other authenticated users can only access their own tasks.
- **`apiPrefilter` in Task**: We then use `allowedTasks` within `apiPrefilter`, ensuring that only allowed tasks are accessible through the API.

## Step 2: Apply the Custom Filter in `TimeEntry`

Now that we have the `allowedTasks` filter, we can use it in the `TimeEntry` entity to restrict access based on the user’s permissions for related tasks.

### TimeEntry Entity

In `TimeEntry`, we apply the `allowedTasks` filter to only show time entries associated with tasks the user is permitted to view:

```file:/shared/TimeEntry.ts title="shared/TimeEntry.ts" add={6-10} collapse={13-26}

```

### Explanation of the Code

- **`apiPrefilter` in TimeEntry**: This prefilter checks `TimeEntry` rows by filtering based on the tasks the user can access. First, we fetch the IDs of tasks allowed for the user by calling `Task.allowedTasks()`. We then use these IDs to filter the `TimeEntry` API, ensuring that only time entries related to accessible tasks are visible.

### Try It Out!

- **Sign in as Alex** (non-admin): Alex can only see time entries for tasks he owns.
- **Sign in as Jane** (admin): Jane can access all time entries, regardless of the task owner.

This setup demonstrates how to efficiently apply consistent access control across related entities using a reusable custom filter.

---

### Improving Performance with SQL-Based Filtering

Below, we modify `apiPrefilter` in `TimeEntry` to use `SqlDatabase.rawFilter`. This lets us directly create a SQL-based filter that leverages the related `Task` entity filter without fetching task data in advance:

```solution:/shared/TimeEntry.ts title="shared/TimeEntry.ts" add={6-18} collapse={21-36}

```

### Explanation of the Code

1. **SQL-Based Filter for Task Access**: Instead of fetching allowed tasks and filtering in memory, we use `SqlDatabase.rawFilter` to create a dynamic SQL subquery that applies `Task.allowedTasks()` directly in the database.

2. **Roles of `dbNamesOf`, `rawFilter`, and `filterToRaw`**:

   - **`dbNamesOf`**: This function retrieves database-specific names for entity fields and tables, which helps build queries compatible with the database schema. In this example, we use `dbNamesOf` to get the table names and field references for `Task` and `TimeEntry`, ensuring SQL compatibility.

   - **`rawFilter`**: The `SqlDatabase.rawFilter` function enables direct SQL manipulation for custom filters. This bypasses the usual in-memory filtering, allowing filters to execute within the database. Here, it constructs an SQL `IN` query that checks if the `taskId` in `TimeEntry` exists in a filtered list of `Task` IDs.

   - **`filterToRaw`**: This helper translates a standard filter (like `Task.allowedTasks()`) into a raw SQL condition. It processes the custom filter defined in `allowedTasks()` and converts it into SQL, ensuring that our `Task` filtering rules are directly translated into the SQL subquery.

3. **Efficient Filtering**: By translating the `allowedTasks` filter to SQL, we ensure that all filtering happens within the database, reducing memory usage and improving query speed for better performance.

### Try It Out!

To see this SQL-based filtering in action:

1. Click **Solve** button to see the try the sql based implementation.
2. Sign in as different users (e.g., Alex and Jane) to observe how access to `TimeEntry` records changes based on the user's roles and permissions.

Using SQL-based filters provides an optimized way to manage related access control by leveraging the database’s capabilities, especially useful when dealing with large datasets or complex access rules.
