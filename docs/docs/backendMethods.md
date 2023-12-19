# Backend Methods

Backend methods run on the backend and are used to improve performance, run server-only code (like send mail), or perform operations that are not accessible through the API.

There are three kinds of backend methods:

1. [Static methods](#static-backend-methods)
2. [Entity instance methods](#entity-backend-methods)
3. [Controller instance methods](#controller-backend-methods)

## Static backend methods

A static backend method, is the simplest kind, it will send its parameters to the backend, and will return its result to the frontend.

1. Define the backend method in a shared module.

```ts
import { BackendMethod, remult } from 'remult'
import { Task } from './Task'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async setAll(completed: boolean) {
    const taskRepo = remult.repo(Task)

    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
}
```

2. Register the `TasksController` class in the `controllers` array of the `remultExpress` options.

```ts{3}
export const api = remultExpress({
  entities: [Task],
  controllers: [TasksController]
})
```

3. Call from the frontend.

```ts
await TasksController.setAll(true)
```

## Entity backend methods

An Entity backend method will send all the entity fields back and forth to the server, including values that were not saved yet.
It can be used to do Entity related operations.

1. Define the backend method.

```ts
@Entity('tasks', {
  allowApiCrud: true,
})
export class Task extends IdEntity {
  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @BackendMethod({ allowed: true })
  async toggleCompleted() {
    this.completed = !this.completed
    console.log({
      title: this.title,
      titleOriginalValue: this.$.title.originalValue,
    })
    await this.save()
  }
}
```

2. Call from the frontend.

```ts
const task = await remult.repo(Task).findFirst()
await task.toggleCompleted()
```

::: danger
Backend methods are not subject to the entity's api restrictions, meaning that an entity that has allowApiUpdate=false, can be updated through code that runs in a `BackendMethod`.
The rule is, if the user can run the `BackendMethod` using its `allowed` option, the operations in it are considered allowed and if they should be restricted, it is up to the developer to restrict them.
:::

## Controller backend methods

A Controller is a class that once one of its backend method is called, will save its field values and send them back and forth between the frontend and the backend.

1. Define the controller and backend method in a shared module.

```ts
import { BackendMethod, Controller, Field, remult } from 'remult'
import { Task } from './Task'

@Controller('SetTaskCompletedController')
export class SetTaskCompletedController {
  constructor() {}
  @Fields.boolean()
  completed = false
  @BackendMethod({ allowed: true })
  async updateCompleted() {
    for await (const task of this.remult.repo(Task).query()) {
      task.completed = this.completed
      await task.save()
    }
  }
}
```

2. Register the `SetTaskCompletedController` class in the `controllers` array of the `remultExpress` options.

```ts{3}
export const api = remultExpress({
  entities: [Task],
  controllers: [SetTaskCompletedController]
})
```

3. Call from the frontend.

```ts
const set = new SetTaskCompletedController()
set.completed = true
await set.updateCompleted()
```

Once the `updateCompleted` method is called, all the `controller`'s field values will be sent to the backend and it can use them. Once the method completes, all the field values will return to the browser.
