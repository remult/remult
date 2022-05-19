# Backend methods
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

## Set All Tasks as Un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAll` async function to the `App` function component, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/App.vue*
   ```ts
   async function setAll(completed: boolean) {
     for (const task of await taskRepo.find()) {
       await taskRepo.save({ ...task, completed })
     }
     fetchTasks();
   }
   ```

   The `for` loop iterates the array of `Task` objects returned from the backend, and saves each task back to the backend with a modified value in the `completed` field.

   After all the tasks are saved, we refetch the task list using the `fetchTasks` function.

2. Add the two buttons to the return section of the `App` component. Both of the buttons' `onClick` events will call the `setAll` function with the appropriate value of the `completed` argument.

   *src/App.vue*
   ```vue
   <div>
     <button @click="setAll(true)">Set all as completed</button>
     <button @click="setAll(false)">Set all as uncompleted</button>
   </div>
   ```

Make sure the buttons are working as expected before moving on to the next step.

## Refactor from Front-end to Back-end
With the current state of the `setAll` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

A simple way to prevent this is to expose an API endpoint for `setAll` requests, and run the same logic on the server instead of the client.

1. Create a new `TasksController` class, in the `shared` folder, and refactor the `for` loop from the `setAll` function of the `App` function component into a new, `static`, `setAll` method in the `TasksController` class, which will run on the server.

*src/shared/TasksController.ts*
```ts
import { BackendMethod, Remult } from "remult";
import { Task } from "./Task";

export class TasksController {
   @BackendMethod({ allowed: true })
   static async setAll(completed: boolean, remult?: Remult) {
      const taskRepo = remult!.repo(Task);

      for (const task of await taskRepo.find()) {
         await taskRepo.save({ ...task, completed });
      }
   }
}
```
The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (the `allowed` property will be discussed later on in this tutorial). 

The optional `remult` argument of the static `setAll` function is intentionally omitted in the client-side calling code. In the server-side, Remult injects `@BackendMethod`-decorated functions with a server `Remult` object. **Unlike the front-end `Remult` object, the server implementation interacts directly with the database.**

2. Register `TasksController` by adding it to the `controllers` array of the `options` object passed to `remultExpress()`, in the server's `api` module:

*src/server/api.ts*
```ts{3,7}
import { remultExpress } from "remult/remult-express";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";

export const api = remultExpress({
   entities: [Task],
   controllers: [TasksController],
   initApi: async remult => {
      const taskRepo = remult.repo(Task);
      if (await taskRepo.count() === 0) {
            await taskRepo.insert([
               { title: "Task a" },
               { title: "Task b", completed: true },
               { title: "Task c" },
               { title: "Task d" },
               { title: "Task e", completed: true }
            ]);
      }
   }
});
```

3. Replace the `for` iteration in the `setAll` function of the `App` component with a call to the `setAll` method in the `TasksController`.

*src/App.vue*
```ts{2}
async function setAll(completed: boolean) {
  await TasksController.setAll(completed);
  fetchTasks();
}
```

::: warning Import TasksController
Remember to add an import of `TasksController` in `App.vue`.
:::

::: tip Note
With Remult backend methods, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the *"Set all..."* buttons function exactly the same, but much faster.