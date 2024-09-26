---
type: lesson
title: Role-based Authorization
template: auth-3
focus: /shared/Task.ts
---

## Role-based Authorization

In most applications, different users have different levels of access. Let's define an `admin` role for our todo app and enforce the following authorization rules:

- All signed-in users can see the list of tasks.
- All signed-in users can mark specific tasks as `completed`.
- Only users with the `admin` role can create or delete tasks.

### Step 1: Modify the Task Entity Class

1. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

```ts title="shared/Task.ts" add={3-4}
@Entity('tasks', {
  allowApiCrud: remult.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
})
export class Task {
  //...
}
```

### Code Explanation

- `allowApiCrud: remult.authenticated`: Ensures that only authenticated users can perform basic CRUD operations.
- `allowApiInsert: 'admin'`: Restricts the creation of tasks to users with the `admin` role.
- `allowApiDelete: 'admin'`: Restricts the deletion of tasks to users with the `admin` role.

### Step 2: Assign Roles in the AuthController

2. Let's make _"Jane"_ an admin and use it to determine her roles in the `signIn` method.

```ts title="shared/AuthController.ts" add={4,17}
const validUsers = [
  {
    name: 'Jane',
    admin: true,
  },
  { name: 'Alex' },
]

export class AuthController {
  @BackendMethod({ allowed: true })
  static async signIn(name: string) {
    const user = validUsers.find((user) => user.name === name)
    if (user) {
      remult.user = {
        id: user.name,
        name: user.name,
        roles: user.admin ? ['admin'] : [],
      }
      remult.context.request!.session!['user'] = remult.user
      return remult.user
    } else {
      throw Error("Invalid user, try 'Alex' or 'Jane'")
    }
  }
  //...
}
```

### Code Explanation

- We added an `admin` property to the `Jane` user object in the `validUsers` array.
- In the `signIn` method, we assign the `admin` role to `remult.user.roles` if the user is an admin. If the user is not an admin, `roles` is set to an empty array.
- The user's role is stored in the session, allowing Remult to enforce authorization rules based on the user's role in subsequent requests.

### Try It Out

Sign in to the app as _"Alex"_ to test that actions restricted to `admin` users, such as creating or deleting tasks, are not allowed.

Then, sign in as _"Jane"_ to confirm that these actions are permitted for admin users.
