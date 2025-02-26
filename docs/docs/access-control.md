# Access Control

::: tip **Interactive Learning Available! 🚀**

Looking to get hands-on with this topic? Try out our new [**interactive tutorial**](https://learn.remult.dev/in-depth/7-access-control/1-field-level-control) on Access Control, where you can explore and practice directly in the browser. This guided experience offers step-by-step lessons to help you master Access Control in Remult with practical examples and exercises.

[Click here to dive into the interactive tutorial on Access Control!](https://learn.remult.dev/in-depth/7-access-control/1-field-level-control)

:::

Access control is essential for ensuring that users can only access resources they are authorized to in web applications. This article explores the various layers of access control, focusing on a framework that provides a granular approach to securing your application.

## Entity-Level Authorization

Entity-level authorization governs CRUD (Create, Read, Update, Delete) operations at the entity level. Each entity can define permissions for these operations using the following options:

- `allowApiRead`: Controls read access.
- `allowApiInsert`: Controls insert access.
- `allowApiUpdate`: Controls update access.
- `allowApiDelete`: Controls delete access.

Each option can be set to a boolean, a string role, an array of string roles, or an arrow function:

```typescript
// Allows all CRUD operations
@Entity("tasks", { allowApiCrud: true })

// Only users with the 'admin' role can update
@Entity("tasks", { allowApiUpdate: 'admin' })

// Only users with 'admin' or 'manager' roles can delete
@Entity("tasks", { allowApiDelete: ['admin', 'manager'] })

// Only the user 'Jane' can read
@Entity("tasks", { allowApiRead: () => remult.user?.name == 'Jane' })

// Only authenticated users can perform CRUD operations
@Entity("tasks", { allowApiCrud: Allow.authenticated })
```

## Row-Level Authorization

Row-level authorization allows control over which rows a user can access or modify.

### Authorization on Specific Rows

The `allowApiUpdate`, `allowApiDelete`, and `allowApiInsert` options can also accept a function that receives the specific item as the first parameter, allowing row-level authorization:

```ts
// Users can only update tasks they own
@Entity<Task>("tasks", { allowApiUpdate: task => task.owner == remult.user?.id })
```

### Filtering Accessible Rows

To limit the rows a user has access to, use the `apiPrefilter` option:

```ts
@Entity<Task>("tasks", {
  apiPrefilter: () => {
    // Admins can access all rows
    if (remult.isAllowed("admin")) return {}
    // Non-admins can only access rows where they are the owner
    return { owner: remult.user!.id }
  }
})
```

The `apiPrefilter` adds a filter to all CRUD API requests, ensuring that only authorized data is accessible through the API.

### Preprocessing Filters for API Requests

For more complex scenarios, you can use `apiPreprocessFilter` to dynamically modify the filter based on the specific request and additional filter information:

```ts
@Entity<Task>("tasks", {
  apiPreprocessFilter: async (filter, {getPreciseValues}) => {
    // Ensure that users can only query tasks for specific customers
    const preciseValues = await getPreciseValues();
    if (!preciseValues.customerId) {
      throw new ForbiddenError("You must specify a valid customerId filter");
    }
    return filter;
  }
})
```

In this example, `apiPreprocessFilter` uses the `getPreciseValues` method to ensure that users must specify a valid `customerId` filter when querying tasks, allowing for more granular control over the data that is accessible through the API.

**Note:** The `preciseValues` object includes the actual values that are used in the filter. For example, in the code sample above, if the `customerId` filter specifies the values `'1'`, `'2'`, and `'3'`, then `preciseValues.customerId` will be an array containing these values. This allows you to check and enforce specific filter criteria in your preprocessing logic.

This added note explains the significance of the `preciseValues` property and how it includes the actual values used in the filter, providing an example for clarity.

### Warning: API Filters Do Not Affect Backend Queries

It's important to note that `apiPrefilter` and `apiPreprocessFilter` only apply to API requests. They do not affect backend queries, such as those executed through backend methods or non-Remult routes.

For instance, in a sign-in scenario, a backend method might need to check all user records to verify a user's existence without exposing all user data through the API. Once authenticated, the user should only have access to their own record for updates.

### Backend Filters for Consistent Access Control

To apply similar filtering logic to backend queries, you can use `backendPrefilter` and `backendPreprocessFilter`:

```ts
@Entity<Task>("tasks", {
  backendPrefilter: () => {
    // Admins can access all rows
    if (remult.isAllowed("admin")) return {}
    // Non-admins can only access rows where they are the owner
    return { owner: remult.user!.id }
  },
  backendPreprocessFilter: async (filter, {getPreciseValues}) => {
    // Apply additional filtering logic for backend queries
    const preciseValues = await getPreciseValues(filter);
    if (!preciseValues.owner) {
      throw new ForbiddenError("You must specify a valid owner filter");
    }
    return filter;
  }
})
```

In this example, `backendPrefilter` and `backendPreprocessFilter` ensure that non-admin users can only access their own tasks in backend queries, providing consistent access control across both API and backend operations.

## Field-Level Authorization

Field-level authorization allows control over individual fields within an entity:

_Field level authorization happens after entity level authorization AND if it's allowed._

- `includeInApi`: Determines if the field is included in the API response.
- `allowApiUpdate`: Controls if a field can be updated. If false, any change to the field is ignored.

Examples:

```ts
// This field will not be included in the API response
@Fields.string({ includeInApi: false })
password = ""

// Only users with the 'admin' role can update this field
@Fields.boolean({ allowApiUpdate: "admin" })
admin = false

// Titles can only be updated by the task owner
@Fields.string<Task>({ allowApiUpdate: task => task.owner === remult.user!.id })
title=''

// This field can only be updated when creating a new entity
@Fields.string<Category>({ allowApiUpdate: (c) => getEntityRef(c).isNew() })
Description = ""
```

### Field Masking

To mask a field, combine a non-API field with a `serverExpression` that returns the masked value:

```ts
// This field is not included in the API response
@Fields.string({ includeInApi: false })
password = ""

// The field value is masked in the API response
@Fields.string<User>({
  serverExpression: () => "***",
  // Update the real password field when the masked field is changed
  saving: async (user, fieldRef, e) => {
    if (fieldRef.valueChanged()) {
      user.password = await User.hash(user.updatePassword)
    }
  },
})
updatePassword = ""
```

## BackendMethod Authorization

Backend methods use the `allowed` option to determine authorization:

```ts
// Only authenticated users can execute this method
@BackendMethod({ allowed: Allow.authenticated })
static async doSomething() {
  // something
}
```

The `allowed` option can receive a boolean, a string role, an array of role strings, or a function.

## Reusing Access Control Definitions in the Frontend

Access control definitions set in entities can be reused as a single source of truth in the frontend. This allows for consistent and centralized management of access control logic across your application. For example, in a React component, you can conditionally render UI elements based on the access control rules defined in the entity:

::: code-group

```tsx [React]
function UserComponent({ user }: { user: User }) {
  //...
  return (
    <tr>
      <td>{user.name}</td>
      {/* Only show the admin field if the user is allowed to see it */}
      {userRepo.fields.admin.includeInApi(user) && <td>{user.admin}</td>}
      {/* Only show the delete button if the user is allowed to delete the admin */}
      {userRepo.metadata.apiDeleteAllowed(user) && (
        <td>
          <button onClick={deleteUser}>Delete</button>
        </td>
      )}
    </tr>
  )
}
```

```html [Angular]
<tr>
  <td>{{user.name}}</td>
  <!-- Only show the admin field if the user is allowed to see it -->
  <td *ngIf="userRepo.fields.admin.includeInApi(user)">{{user.admin}}</td>
  <!-- Only show the delete button if the user is allowed to delete the admin-->
  <td *ngIf="userRepo.metadata.apiDeleteAllowed(user)">
    <button (click)="deleteUser(user)">Delete</button>
  </td>
</tr>
```

```vue [Vue]
<tr>
  <td>{{user.name}}</td>
  <!-- Only show the admin field if the user is allowed to see it -->
  <td v-if="userRepo.fields.admin.includeInApi(user)">{{user.admin}}</td>
  <!-- Only show the delete button if the user is allowed to delete the admin-->
  <td v-if="userRepo.metadata.apiDeleteAllowed(user)">
    <button @click="deleteUser(user)">Delete</button>
  </td>
</tr>
```

```svelte [Svelte]
<tr>
  <td>{{user.name}}</td>
  <!-- Only show the admin field if the user is allowed to see it -->
  {#if userRepo.fields.admin.includeInApi(user)}
  <td>{{user.admin}}</td>
  {/if}
  <!-- Only show the delete button if the user is allowed to delete the admin-->
  {#if userRepo.metadata.apiDeleteAllowed(user)}
  <td>
    <button (click)="deleteUser(user)">Delete</button>
  </td>
  {/if}
</tr>
```

:::

## Additional Resources

Check out this informative [YouTube video](https://www.youtube.com/watch?v=9lWQwAUcKEM). It discusses the concepts covered in this article and provides practical examples to help you understand how to implement robust access control in your applications.

---

This article provides a comprehensive overview of the layers of access control in web applications, offering a granular approach to securing your application at the entity, row, field, and method levels.
