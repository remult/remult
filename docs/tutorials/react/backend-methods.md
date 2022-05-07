# Backend methods
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

### Set all tasks as un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add the `reload` state to manually force re-execution of the `useEffect` hook
   ```ts{1,7}
   const [reload, setReload] = useState({});
   useEffect(() => {
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: hideCompleted ? false : undefined }
     }).then(setTasks);
   }, [hideCompleted, reload]);   
   ```
   Now we can call the `setReload({})` function to cause the `useEffect` to run again.
2. Add a `setAll` async function to the `App` function component, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/App.tsx*
   ```ts
   const setAll = async (completed: boolean) => {
     for (const task of await taskRepo.find()) {
       await taskRepo.save({ ...task, completed });
     }
     setReload({});
   }
   ```

   The `query` method is an alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects. The `query` method doesn't return an array (as the `find` method) and instead returns an `iteratable` object which supports iterations using the JavaScript `for await` statement.


3. Add the two buttons to the `App.tsx` template, immediately before the unordered list element. Both of the buttons' `click` events will call the `setAll` function with the relevant value of the `completed` argument.

   *src/App.tsx*
   ```tsx
   <div>
      <button onClick={() => setAll(true)}>Set all as completed</button>
      <button onClick={() => setAll(false)}>Set all as uncompleted</button>
   </div>
   ```

Make sure the buttons are working as expected before moving on to the next step.
### Refactoring `setAll` to have it run on the server
With the current state of the `setAll` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

A simple way to prevent this is to expose an API endpoint for `setAll` requests, and run the same logic on the server instead of the client.

1. Create a new `TasksController` class, in the `shared` folder, and refactor the `for await` loop from the `setAll` function of the `App` function component into a new, `static`, `setAll` function in the `TasksController` class,  which will run on the server.

   *src/shared/TasksController.ts*
   ```ts
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./Task";
   
   export class TasksController {
       @BackendMethod({ allowed: true })
       static async setAll(completed: boolean, remult?: Remult) {
           const taskRepo = remult!.repo(Task);
           for await (const task of taskRepo.query()) {
               await taskRepo.save({ ...task, completed });
           }
       }
   }
   ```

2. Add the `TasksController` to the `controllers` array in the server's `index` module:

   *src/server/index.ts*
   ```ts{4,9}
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   
   let app = express();
   app.use(remultExpress({
       entities: [Task],
       controllers: [TasksController],
       initApi: async remult => {
           const taskRepo = remult.repo(Task);
           if (await taskRepo.count() == 0) {
               await taskRepo.insert([
                   { title: "Task a" },
                   { title: "Task b", completed: true },
                   { title: "Task c" },
                   { title: "task d" },
                   { title: "task e", completed: true }
               ]);
           }
       }
   }));
   
   app.listen(3002, () => console.log("Server started"));
   ```

3. Call the `setAll` method in the `TasksController`
   *src/App.tsx*
   ```ts{2}
   const setAll = async (completed: boolean) => {
     await TasksController.setAll(completed);
     setReload({});
   }
   ```
   ::: danger Import TasksController
   Don't forget to import `TasksController`.
   :::

The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (the `allowed` property will be discussed later on in this tutorial). 

The optional `remult` argument of the static `setAll` function is omitted in the client-side calling code, and injected by Remult on the server-side with a server `Remult` object. **Unlike the client implementation of the Remult `Remult`, the server implementation interacts directly with the database.**

::: warning Note
With Remult backend methods, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the "Set all..." buttons function exactly the same, but they will do the work much faster.
