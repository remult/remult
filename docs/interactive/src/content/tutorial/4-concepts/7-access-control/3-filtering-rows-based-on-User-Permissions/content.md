---
type: lesson
title: Filtering Rows Based on User Permissions
template: access-control
focus: /shared/Task.ts
---

# Filtering Rows Based on User Permissions

Filtering rows based on user permissions ensures that users only access the rows they are authorized to see, update, or delete. This lesson covers using `apiPrefilter` to define permission-based filters applied to API requests, providing security and data isolation for users.

```file:/shared/Task.ts title="shared/Task.ts" collapse={12-30} add={4-8}

```

### Code Explanation

1. **Admin Access**

   - If the user has an `admin` role, `apiPrefilter` returns an empty filter (`{}`), allowing access to all rows without restriction.

2. **Authenticated User Access**

   - For authenticated users who are not admins, `apiPrefilter` restricts access to rows where the `ownerId` matches the current user's ID, allowing users to view only their own tasks.

3. **Unauthorized Access**
   - If the user is not authenticated or doesn’t meet any conditions, `apiPrefilter` raises a `ForbiddenError`, blocking access entirely.

### Authorization Beyond Read Access

`apiPrefilter` not only restricts read access but also applies to `update` and `delete` operations. Users can only update or delete rows they have permission to access, adding a layer of security to ensure data isolation across user roles.

### Important Considerations

- **API Scope**

  - `apiPrefilter` applies only to API rules. This means it governs only API-based access, so backend methods or direct backend queries bypass this filter. To apply similar restrictions to backend access, use `backendPrefilter`.

- **Consistent Rules with `backendPrefilter`**
  - In cases where you need uniform access control across both API and backend, adding a `backendPrefilter` alongside `apiPrefilter` helps ensure that both API and backend methods adhere to the same filtering logic. This is essential in scenarios where sensitive data could be exposed or modified directly within backend logic.

### Try It Out!

To see `apiPrefilter` in action, try signing in as different users:

- **Sign in as Alex** (non-admin): Alex can only see, update, and delete tasks he owns.
- **Sign in as Jane** (admin): Jane, as an admin, can access, update, and delete all tasks.

By switching between these accounts, you’ll observe how `apiPrefilter` limits access based on user roles, ensuring that each user only interacts with rows they're authorized to see and modify.

---

By combining `apiPrefilter` with row-specific rules in `allowApiUpdate`, `allowApiDelete`, and `allowApiInsert`, you gain a powerful framework for dynamic, row-level security based on user permissions. This approach protects data integrity and enhances security across various layers of application logic.
