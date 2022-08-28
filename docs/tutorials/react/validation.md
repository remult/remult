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

2. In the `App.tsx` template, modify the `saveTask` function to catch exceptions.

*src/App.tsx*
```tsx{2,5-7}
const saveTask = async () => {
  try {
    const savedTask = await taskRepo.save(task);
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

Try making the following `POST` http request to the `http://localhost:3002/api/tasks` API route, providing an invalid title.

```sh
curl -i http://localhost:3002/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,

::: tip Custom validation
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
:::

## Render Error Text Using React

Let's use the `tasks` React state to store errors and display them next to the relevant `input` element.

1. Add an `error` property of `error?: ErrorInfo<Task>` to the item type of the `tasks` array.

*src/App.tsx*
```tsx
const [tasks, setTasks] = useState<(Task & { error?: ErrorInfo<Task> })[]>([]);
```

::: warning Import ErrorInfo
This code requires adding an import of `ErrorInfo` **from `remult`** (not from React).
:::

2. Modify the `saveTask` function to store the errors.

*src/App.tsx*
```tsx{7}
const saveTask = async () => {
  try {
    const savedTask = await taskRepo.save(task);
    setTasks(tasks.map(t => t === task ? savedTask : t));
  } catch (error: any) {
    alert(error.message);
    setTasks(tasks.map(t => t === task ? { ...task, error } : t));
  }
};
```

3. Add the highlighted code line to display the error next to the task title `input`:
   
*src/App.tsx*
```tsx{11}
return (
  <div key={task.id}>
    <input type="checkbox"
      checked={task.completed}
      onChange={e => handleChange({ completed: e.target.checked })} />
    <input
      value={task.title}
      onChange={e => handleChange({ title: e.target.value })} />
    <button onClick={saveTask}>Save</button>
    <button onClick={deleteTask}>Delete</button>
    <span>{task.error?.modelState?.title}</span>
  </div>
);
```

The `modelState` property of the `ErrorInfo` object contains error messages for any currently invalid fields in the entity object.