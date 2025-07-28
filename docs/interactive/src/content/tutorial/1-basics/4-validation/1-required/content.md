---
type: lesson
title: Required
focus: /shared/Task.ts
---

# Validation Introduction

In most web applications, validation code is spread and duplicated across multiple places. You need frontend validation, and you need API validation, all in various forms, controllers, routes, and services.

It's very hard to get validations right across the entire application, and often you'll run into validation errors on the API that do not display gracefully on the frontend. Even worse, validation that is done only on the frontend can be bypassed by calling the API directly.

Remult handles that concern with the SSO (Single Source of Truth) approach, where you define your validation once—in your entity—and that validation code runs both on the frontend and the API, ensuring consistent validation across the stack.

## Required Validation

Let's start with a simple `required` validation.

Adjust the `title` field to be `required`:

```ts title="shared/Task.ts" add={5-7}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string({
    required: true,
  })
  title = ''

  //....
}
```

### Code Explanation

- We added the `required: true` option to the `title` field using the `@Fields.string` decorator.
- This ensures that the `title` field is required and cannot be empty.

### Validation Behavior

- This validation will be first checked on the frontend, without making an API call (frontend validation).
- The same validation will also be executed on the API, ensuring consistency across the stack.

Try adding a task with no title to see the validation in action.

Also - checkout the browser's network tab, and see that there is no network call to the backend - the validation is performed in the frontend.

> **Note:** In this tutorial, the errors appear in the browser's alert dialog as specified in the code in our `Todo.tsx` component:
>
> ```tsx title="frontend/Todo.tsx" add={8}
> async function addTask(e: FormEvent) {
>   e.preventDefault()
>   try {
>     const newTask = await taskRepo.insert({ title: newTaskTitle })
>     setTasks([...tasks, newTask])
>     setNewTaskTitle('')
>   } catch (error: any) {
>     alert((error as { message: string }).message)
>   }
> }
> ```

---

When an error occurs, it returns an error of type `ErrorInfo<Task>` that specifies the error for each field, allowing you to create a great UI where the error for a field is displayed next to its input.

Here's an example of the error response:

```json
{
  "message": "Title: Should not be empty",
  "modelState": {
    "title": "Should not be empty"
  }
}
```

This ensures that the validation error is clear and can be displayed appropriately in the UI.

### Validation on the Api

The same validation code that runs in the frontend, is also used to validate the api - if anyone tries to send an invalid request to the api they'll fail.

:::tip
You can try and bypass the frontend validation, by making a post call directly from the browser's console.

Right click on the `preview` window, and select `inspect`, you'll be able to run the api call directly from the developer tools console (at least on chrome)

```js
await fetch('/api/tasks', { method: 'POST', body: '' }).then((r) => r.json())
```

See the result error object that's returned
:::
