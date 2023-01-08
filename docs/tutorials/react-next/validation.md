# Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

## Validate the Title Field

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Fields.string` decorator for the `title` field to include an object literal argument and set the object's `validate` property to `Validators.required`.

*src/shared/Task.ts*
```ts{1-3}
@Fields.string({
    validate: Validators.required
})
title = '';
```
::: warning Import Validators
This code requires adding an import of `Validators` from `remult`.
:::

2. In the `home/index.tsx` template, modify the `saveTask` function to catch exceptions.

*pages/index.tsx*
```tsx{2,5-7}
const saveTask = async () => {
  try {
    const savedTask = await remult.repo(Task).save(task);
    setTasks(tasks.map(t => t === task ? savedTask : t));
  } catch (error: any) {
    alert(error.message);
  }
}
```

::: warning Manual refresh required
For this change to take effect, you **must manually refresh the browser**.
:::

After the browser is refreshed, try creating a new `task` or saving an existing one with an empty title - the *"Should not be empty"* error message is displayed.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:3000/api/tasks` API route, providing an invalid title.

```sh
curl -i http://localhost:3000/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,

## Custom Validation
The `validate` property of the first argument of `Remult` field decorators can be set to an arrow function which will be called to validate input on both front-end and back-end.

Try something like this and see what happens:

*src/shared/Task.ts*
```ts
@Fields.string<Task>({
    validate: (task) => {
        if (task.title.length < 3)
            throw "Too Short";
    }
})
title = '';
```
