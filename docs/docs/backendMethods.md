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
