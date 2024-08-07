---
type: lesson
title: Introduction
template: after-backend-methods
focus: /shared/Task.ts
---

# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create, or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism and are only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use `Express`'s [cookie-session](https://expressjs.com/en/resources/middleware/cookie-session.html) middleware to store an authenticated user's session within a cookie. The `user` property of the session will be set by the API server upon a successful simplistic sign-in (based on username without password).

## Tasks CRUD Requires Sign-in

This rule is implemented within the `Task` `@Entity` decorator by modifying the value of the `allowApiCrud` property. This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

```ts add={2}
@Entity("tasks", {
  allowApiCrud: remult.authenticated
})
```

### Code Explanation

- We updated the `allowApiCrud` property in the `Task` entity to use `remult.authenticated`, which ensures that CRUD operations on tasks require an authenticated user.

## Try It Out

Try it out and see that once you make this change, no data will appear below since you are not signed in, and therefore not authenticated.

### Authorized Server-side Code Can Still Modify Tasks

Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAllCompleted` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAllCompleted` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAllCompleted` method of `TasksController`.

```ts add={2}
export class TasksController {
  @BackendMethod({ allowed: remult.authenticated })
  static async setAllCompleted(completed: boolean) {
```

### Code Explanation

- We updated the `allowed` property in the `@BackendMethod` decorator to use `remult.authenticated`, ensuring that the `setAllCompleted` function requires an authenticated user to execute.
