# Working without decorators

If you prefer to work without decorators, or use `remult` in a javascript project (without typescript) you can use the following:

## Entity

::: code-group

```ts [Typescript]
import { Entity, Fields, describeEntity } from 'remult'

export class Task {
  id!: string
  title = ''
  completed = false
}
describeEntity(
  Task,
  'tasks',
  {
    allowApiCrud: true,
  },
  {
    id: Fields.uuid(),
    title: Fields.string(),
    completed: Fields.boolean(),
  },
)
```

```js [Javascript]
import { Entity, Fields, describeEntity } from 'remult'

export class Task {
  id
  title = ''
  completed = false
}
describeEntity(
  Task,
  'tasks',
  {
    allowApiCrud: true,
  },
  {
    id: Fields.uuid(),
    title: Fields.string(),
    completed: Fields.boolean(),
  },
)
```

:::

This is the same entity that is detailed in the [Entities section of the tutorial](https://remult.dev/tutorials/react/entities.html)

## Static BackendMethod

```ts{12-14}
import { BackendMethod, describeBackendMethods, repo } from "remult";
import { Task } from "./Task";

export class TasksController {
  static async setAll(completed: boolean) {
    const taskRepo = repo(Task);
    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed });
    }
  }
}
describeBackendMethods(TasksController, {
  setAll: { allowed: "admin" }
})
```

This is the same backend method that is detailed in the [Backend methods of the tutorial](https://remult.dev/tutorials/react/backend-methods.html#refactor-from-front-end-to-back-end)
