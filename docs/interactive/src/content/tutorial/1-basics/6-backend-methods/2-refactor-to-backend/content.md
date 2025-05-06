---
type: lesson
title: Refactor to Backend
focus: /shared/TasksController.ts
---

# Refactor from Frontend to Backend

To improve performance, let's refactor the frontend code and move it to the backend.

## Step 1: Create the Backend Method

We'll add a `shared/TasksController.ts` file with the following code:

```ts title="shared/TasksController.ts" add={5-11}
import { BackendMethod, remult } from 'remult'
import { Task } from './Task.js'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async setAllCompleted(completed: boolean) {
    const taskRepo = remult.repo(Task)
    for (const task of await taskRepo.find()) {
      await taskRepo.update(task, { completed })
    }
  }
}
```

### Code Explanation

- We created a `TasksController` class to contain backend methods.
- The `setAllCompleted` method is decorated with `@BackendMethod({ allowed: true })`, making it accessible from the frontend.
- Inside `setAllCompleted`, we get the repository for `Task` using `remult.repo(Task)`.
- We iterate through the tasks and update each one with the new `completed` status.
- Previously, in the frontend, the `taskRepo` repository performed HTTP calls to the backend. Now that we're on the backend, the `taskRepo` repository makes direct API calls to the database.
- An advantage of this approach is that using the `taskRepo` repository allows us to use the same coding style for both the frontend and backend, making it easier for us as developers to switch back and forth.

## Step 2: Register the Controller

Head over to the `backend/index.ts` file and register the controller:

```ts title="backend/index.ts" add={3}
export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  initApi: async () => {
    //...
  },
})
```

### Code Explanation

- By adding `controllers: [TasksController]`, we make the `TasksController` available for API calls from the frontend.

## Step 3: Adjust the Frontend

Adjust the `frontend/Todo.tsx` component to call the backend method:

```tsx title="frontend/Todo.tsx" add={4}
async function setAllCompleted(completed: boolean) {
  await TasksController.setAllCompleted(completed)
}
```

### Code Explanation

- We removed the `for` loop and the direct update calls from the frontend.
- We now call `TasksController.setAllCompleted(completed)` to perform the updates on the backend.
- After the backend method completes, we refresh the task list by calling `taskRepo.find().then(setTasks)`.
- An advantage of this approach is that the call to `setAllCompleted` is strongly typed, protecting us from spelling or typing mistakes using TypeScript.

### Try It Out

Click the "Set All Completed" and "Set All Uncompleted" buttons to see the improved performance with the backend method handling the updates.
