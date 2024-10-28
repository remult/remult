---
type: lesson
title: Intro & Field-Level Authorization
template: access-control
focus: /shared/Task.ts
---

# Field-Level Authorization in Remult

This lesson builds upon the foundational [Authentication & Authorization](../../../1-basics/7-auth/1-introduction/) article, so please review that if you haven't yet. Now, let’s dive into adding fine-grained access control by managing authorization on a field-by-field basis within your entities.

### Adding `ownerId` Field with Controlled Updates

To start, we want each task to record the `ownerId`, which tracks who created or owns the task.

Here’s how to add the `ownerId` field to the `Task` entity:

```file:/shared/Task.ts title="shared/Task.ts" collapse={1-5,7-17} add={21-24}
@Fields.string({
  allowApiUpdate: false, // Prevents updates via API
})
ownerId = remult.user?.id || ''
```

Setting `allowApiUpdate: false` ensures that once set, the `ownerId` cannot be modified through the API. This is useful for data fields you want to update only on the backend, while still allowing API updates for other fields.

:::warn

### API Rules Apply Only to API Access

The `allowApiUpdate`, `includeInApi`, and other access control options only apply to requests made through the API. They do not restrict access to data within backend methods or any code that directly interacts with the database on the backend - **including SSR (Server Side Rendering) scenarios**.

If you execute code directly on the backend, such as through a backend method or non-API route, you will still be able to view and modify all fields, regardless of the access restrictions defined for the API.

**Be mindful** of this distinction, as it is crucial for securing your application. Backend operations should be handled with caution, especially when dealing with sensitive or restricted data.

:::

### Controlling Field Access by Role

With Remult, the `allowApiUpdate` option lets you control which users or roles can update a specific field. For example:

```ts
@Fields.boolean({
  allowApiUpdate: 'admin', // Only users with the 'admin' role can update
})
completed = false
```

This configuration restricts updates to users with the `admin` role only. To see this in action, try signing in as "Alex" (non-admin) and "Jane" (admin), and notice how the ability to change the `completed` status differs.

#### Tip: Try it out in the Admin UI

The same authorization rules apply to fields in the Remult Admin UI. You can experiment further by navigating to the `Remult Admin UI` link, where you’ll see that updates follow the same API restrictions set in the code.

### Conditional Authorization with Arrow Functions

Authorization can also be controlled using more dynamic conditions through arrow functions. For example, suppose we want either an `admin` or the task `owner` to be able to update the `completed` field. We could define the field like this:

```ts
@Fields.boolean<Task>({
  allowApiUpdate: task => remult.isAllowed("admin") || task.ownerId === remult.user?.id,
})
completed = false
```

- `allowApiUpdate` is set to an arrow function that takes the `task` entity as a parameter.
- **Condition 1**: `remult.isAllowed("admin")` checks if the current user has the "admin" role. If they do, they can update the field.
- **Condition 2**: `task.ownerId === remult.user?.id` checks if the current user is the task owner by comparing the `ownerId` field in the task to the current user’s ID.

If either condition is true (i.e., the user is an "admin" or the task owner), the `completed` field can be updated. If both are false, the update is blocked.

This conditional approach allows flexible, role-based, and ownership-based control over specific fields in an entity.

### Allowing Updates Only on New Rows

Another useful pattern is to restrict updates to a field when a task is first created but disallow changes afterward:

```ts
allowApiUpdate: (task) => getEntityRef(task).isNew()
```

This ensures the field is set initially but prevents further modifications.

## Hiding Fields with `includeInApi`

The `includeInApi` option allows you to prevent specific fields from appearing in the API response altogether. This is particularly useful for sensitive data like passwords or other restricted fields.

```ts
@Fields.string({
  includeInApi: false, // Omits this field from API responses
})
password = ''
```

### Versatile Options for `includeInApi`

Just like `allowApiUpdate`, the `includeInApi` option offers versatility. You can set it to `true`, `false`, specific roles, or an arrow function for dynamic control over who can access the field in the API response. This makes `includeInApi` highly adaptable to various access requirements.

Examples:

1. **Role-Based Access**:

   ```ts
   @Fields.string({
     includeInApi: 'admin', // Only users with 'admin' role see this field
   })
   privateInfo = ''
   ```

2. **Conditional Access with an Arrow Function**:
   ```ts
   @Fields.string<Task>({
     includeInApi: task => remult.isAllowed("admin") || task.ownerId === remult.user?.id,
   })
   privateNotes = ""
   ```

In this example:

- **Admin Access**: If the user has the "admin" role, they see the `privateNotes` field.
- **Owner Access**: The task owner can also see `privateNotes`.

This flexibility with `includeInApi` allows you to apply fine-grained control over which users can access specific data, enhancing security and providing precise control over your API’s data exposure.

### Summary

By using `allowApiUpdate` and `includeInApi`, you have fine-grained control over which fields users can modify or view based on roles, data ownership, and custom conditions.
