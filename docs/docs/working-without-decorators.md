# Working without decorators
If you prefer to work without decorators, or use `remult` in a javascript project (without typescript) you can use the following:

## Entity
::: code-group

```ts [Typescript]
import { Entity, Fields, describeClass } from "remult";

export class Task {
  id!: string;
  title = '';
  completed = false;
}
describeClass(Task,
  Entity("tasks", {
    allowApiCrud: true
  }),
  {
    id: Fields.uuid(),
    title: Fields.string(),
    completed: Fields.boolean()
  })
```

```js [Javascript]
import { Entity, Fields, describeClass } from "remult";

export class Task {
  id;
  title = '';
  completed = false;
}
describeClass(Task,
  Entity("tasks", {
    allowApiCrud: true
  }),
  {
    id: Fields.uuid(),
    title: Fields.string(),
    completed: Fields.boolean()
  })
```

:::

This is the same entity that is detailed in the [Entities section of the tutorial](https://remult.dev/tutorials/react/entities.html)

## Static BackendMethod
```ts{12-14}
import { BackendMethod, describeClass, remult } from "remult";
import { Task } from "./Task";

export class TasksController {
  static async setAll(completed: boolean) {
    const taskRepo = remult.repo(Task);
    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed });
    }
  }
}
describeClass(TasksController, undefined, undefined, {
  setAll: BackendMethod({ allowed: "admin" })
})
```
This is the same backend method that is detailed in the [Backend methods of the tutorial](https://remult.dev/tutorials/react/backend-methods.html#refactor-from-front-end-to-back-end)

## Controller with BackendMethod
```ts{13-18}
import { describeClass, BackendMethod, Controller, Fields, remult } from "remult";
import { Task } from "./Task";

export class SetTaskCompletedController {
  completed = false;
  async updateCompleted() {
    for await (const task of remult.repo(Task).query()) {
      task.completed = this.completed;
      await task.save();
    }
  }
}
describeClass(SetTaskCompletedController,
  Controller('SetTaskCompletedController'),
  {
    completed: Fields.boolean(),
    updateCompleted: BackendMethod({ allowed: true })
  });
```

## Entity with backend method
```ts
import { Entity, Fields, describeClass, EntityBase, BackendMethod } from "remult";

export class Task extends EntityBase {
  id!: string;
  title = '';
  completed = false;
  async toggleCompleted() {
    this.completed = !this.completed;
    console.log({
      title: this.title,
      titleOriginalValue: this.$.title.originalValue
    })
    await this.save();
  }
}
describeClass(Task,
  Entity("tasks", {
    allowApiCrud: true
  }),
  {
    id: Fields.uuid(),
    title: Fields.string(),
    completed: Fields.boolean(),
    toggleCompleted: BackendMethod({ allowed: true })
  })
```
