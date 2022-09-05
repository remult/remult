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

2. In the `App.vue` template, modify the `saveTask` function to catch exceptions.

*src/App.vue*
```ts{2,5-7}
async function saveTask(task: Task) {
  try {
    const savedTask = await taskRepo.save(task);
    tasks.value = tasks.value.map(t => t === task ? savedTask : t);
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

## Render Error Text Using Vue

Let's use the `tasks` array to store errors and display them next to the relevant `input` element.

1. Add an `error` property of `error?: ErrorInfo<Task>` to the item type of the `tasks` array.

*src/App.vue*
```ts
const tasks = ref<(Task & { error?: ErrorInfo<Task> })[]>([]);
```

::: warning Import ErrorInfo
This code requires adding an import of `ErrorInfo` **from `remult`**.
:::

1. Modify the `saveTask` function to store the errors.

*src/App.vue*
```ts{1,7}
async function saveTask(task: (Task & { error?: ErrorInfo<Task> })) {
  try {
    const savedTask = await taskRepo.save(task);
    tasks.value = tasks.value.map(t => t === task ? savedTask : t);
  } catch (error: any) {
    alert(error.message);
    task.error = error;
  }
}
```

3. Add the highlighted code line to display the error next to the task title `input`:
   
*src/App.vue*
```vue{10}
<template>
  <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed
  <div>
    <main>
      <div v-for="task in tasks">
        <input type="checkbox" v-model="task.completed" />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
        <button @click="deleteTask(task)">Delete</button>
        <span>{{ task.error?.modelState?.title }}</span>
      </div>
    </main>
    <button @click="addTask()">Add Task</button>
  </div>
</template>
```

The `modelState` property of the `ErrorInfo` object contains error messages for any currently invalid fields in the entity object.