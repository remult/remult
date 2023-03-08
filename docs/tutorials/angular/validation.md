# Validation

Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

::: warning Handling validation errors

When a validation error occurs, Remult will throw an exception. 

In this tutorial, [CRUD operations](crud.md) catch these exceptions, and alert the user.
We leave it to you to decide how to handle validation errors in your application.
:::

## Validate the Title Field

Task titles are required. Let's add a validity check for this rule.

1. In the `Task` entity class, modify the `Fields.string` decorator for the `title` field to include an object literal argument and set the object's `validate` property to `Validators.required`.

```ts{3-5}
// src/shared/Task.ts

@Fields.string({
  validate: Validators.required
})
title = ""
```

::: warning Import Validators
This code requires adding an import of `Validators` from `remult`.
:::

::: warning Manual browser refresh required
For this change to take effect, you **must manually refresh the browser**.
:::

After the browser is refreshed, try creating a new `task` or saving an existing one with an empty title - the _"Should not be empty"_ error message is displayed.

### Implicit server-side validation

The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:3002/api/tasks` API route, providing an invalid title.

```sh
curl -i http://localhost:3002/api/tasks -d "{\"title\": \"\"}" -H "Content-Type: application/json"
```

An http error is returned and the validation error text is included in the response body,

## Custom Validation

The `validate` property of the first argument of `Remult` field decorators can be set to an arrow function which will be called to validate input on both front-end and back-end.

Try something like this and see what happens:

```ts
// src/shared/Task.ts

@Fields.string<Task>({
  validate: (task) => {
    if (task.title.length < 3) throw "Too Short"
  }
})
title = ""
```
