# Todo App with React

### Build a production ready task list app with Remult using a React frontend

In this tutorial we are going to create a simple app to manage a task list. We'll use `React` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer Angular?
Check out the [Angular tutorial](./tutorial-angular).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `React`.

Before you begin, make sure you have [Node.js](https://nodejs.org) installed. <!-- consider specifying Node minimum version with npm -->


## Setup for the Tutorial
This tutorial requires setting up a React project, an API server project and a few lines of code to add Remult.

:::details TLDR: Follow these steps to skip the manual setup and dive straight into coding the app

1. Clone the [remult-react-todo](https://github.com/remult/remult-react-todo) repository and install its dependencies.

   ```sh
   md remult-react-todo
   cd remult-react-todo
   git init
   git pull https://github.com/remult/remult-react-todo.git
   npm i
   ```
2. Open your IDE.
3. Open a terminal and run the `dev-node` npm script to start the dev API server.

   ```sh
   npm run dev-node
   ```
4. Open another terminal and start the React app by running the `dev-react` script. **Don't stop the `dev-node` script. `dev-react` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-react
   ```

The default React app main screen should be displayed.

At this point our starter project is up and running. We are now ready to [start creating the task list app](#entities-and-crud-operations).
:::

### Create a React Project
Create the new React project.
```sh
npx create-react-app remult-react-todo --template typescript
```

### Adding Remult and Server Stuff
In this tutorial we'll be using the workspace folder created by `React` as the root folder for our server project as well.
```sh
cd remult-react-todo
```

#### Installing required packages
We need [axios](https://axios-http.com/) to serve as an HTTP client, `Express` to serve our app's API and, of course, `Remult`.
```sh
npm i axios express remult
npm i --save-dev @types/express
```
#### The API server project
The starter API server TypeScript project contains a single module which initializes `Express`, loads the Remult middleware `remultExpress`, and begins listening for API requests.

In our development environment we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server.

1. Install `ts-node-dev`
   ```sh
   npm i ts-node-dev --save-dev
   ```

2. Open your IDE.

3. Create a `server` folder under the `src/` folder created by React.

4. Create an `index.ts` file in the `src/server/` folder with the following code:

   *src/server/index.ts*
   ```ts
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   
   const app = express();
   app.use(remultExpress());
   app.listen(3002, () => console.log("Server started"));
   ```

5. In the root folder, create a TypeScript config file `tsconfig.server.json` for the server project.

   *tsconfig.server.json*
   ```json
   {
      "extends": "./tsconfig.json",
      "compilerOptions": {
         "outDir": "./dist/server",
         "module": "commonjs",
         "noEmit": false,
         "emitDecoratorMetadata": true
      },
      "include": [
         "src/server/index.ts"
      ]
   }
   ```

6. Create an `npm` script `dev-node` to start the dev API server, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-node": "ts-node-dev --project tsconfig.server.json src/server/"
   ```
   
7. Add the `dist` folder to the `.gitignore` file
   *.gitignore*
   ```
   /dist
   ```
8. Start the dev API server.

   ```sh
   npm run dev-node
   ```
ַ
The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

### Finishing up the Starter Project

#### Proxy API requests from React DevServer to the API server and run the React app
The React app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the React app is served from the default `http://localhost:3000`. 

We'll use the [proxy](https://create-react-app.dev/docs/proxying-api-requests-in-development/) feature of webpack dev server to divert all calls for `http://localhost:3000/api` to our dev API server.

1. Configure the proxy by adding the following entry to the main section of the project's package.json file.

   *package.json*
   ```json
   "proxy": "http://localhost:3002"
   ```

2. Create an `npm` script `dev-react` to serve the React app, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-react": "react-scripts start"
   ```

   ::: warning Note
   The existing `start` and `build` npm scripts created by CRA will be modified in the [Deployment](#deployment) section of this tutorial to scripts that will `start` and `build` the full-stack app.
   :::

3. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.
   
   *tsconfig.json*
   ```json
   "experimentalDecorators": true
   ```

4. Start the React app in a new terminal. **Don't stop the `dev-node` script. `dev-react` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-react
   ```

The default React app main screen should be displayed.

::: tip
If you are using Visual Studio Code and would like to run both `dev-node` and `dev-react` scripts using a single Visual Studio Code `task`, create a `.vscode/tasks.json` file with the contents found [here](https://gist.github.com/noam-honig/a303635aded118169c4604fc7c5e988b) and run the `dev` task.
:::

#### Setting up a global Remult object for the React app
Our React starter project is almost ready. All that's left is to add a global `Remult` object which will be used to communicate with the API server via a `Promise` based HTTP client (in this case - `Axios`).

Create an `common.ts` file in the `src/` folder with the following code:

*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```

### Setup completed
At this point our starter project is up and running. We are now ready to start creating the task list app.

::: tip Bonus 
Setup [Swagger UI](../docs/adding-swagger) and/or a [GraphQL backend](../docs/adding-graphql) in seconds.
:::

## Entities 

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints, API queries and database commands

The `Task` entity class we're creating will have an auto generated uuid `id` field a `title` field and a `completed` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.
1. Create a directory called `shared` in the `src` directory - in this folder we'll place code that is shared by the frontend and backend.
2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

   *src/Task.ts*
   ```ts
   import { Entity, Fields } from "remult";
   @Entity("tasks", {
      allowApiCrud: true
   })
   export class Task {
      @Fields.uuid()
      id!: string;
      @Fields.string()
      title = '';
      @Fields.boolean()
      completed = false;
   }
   ```


4. Add the `Task` entity to the `entities` array in the server's `index.ts` file:

   *src/server/index.ts*
   ```ts{3,7}
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';

   let app = express();
   app.use(remultExpress({
      entities: [Task]
   }));

   app.listen(3002, () => console.log("Server started"));
   ```

The [@Entity](../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an argument which implements the `EntityOptions` interface. We use an object literal to instantiate it, setting the [allowApiCrud](../docs/ref_entity.md#allowapicrud) property to `true`.

The `@Fields.uuid` decorator tells remult to automatically generate an id using `uuid`. We mark that property as optional, since the id will be auto-generated. 

The [@Fields.string](../docs/ref_field.md) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

### Insert seed test data
*src/server/index.ts*
```ts{8-19}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { Task } from '../shared/Task';

let app = express();
app.use(remultExpress({
    entities: [Task],
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
}));

app.listen(3002, () => console.log("Server started"));
```

The `initApi` hook is called once when the server is ready and can be used to perform init operations.
we start by asking `remult` to provide us a [Repository](../docs/ref_repository.md) of type `Task`. The `Repository` will be used to perform CRUD operations on `Task`.
Then we check if there are no rows, insert 5 rows to the db, to be used as test data.


Once you save the `index.ts` file the backend will restart and create these 5 rows. Navigate to the `tasks` API route at <http://localhost:3002/api/tasks> to see the tasks have been successfully stored on the server.

::: warning Wait, where is the backend database?
In this tutorial we start by storing entity data in a backend JSON database. Notice that a `db` folder has been created under the workspace folder, with a `tasks.json` file containing the created tasks.

`remult` supports many databases, including `postgres` (which we'll use later in this tutorial), `mongodb`  and many others - see [Optional Databases](https://remult.dev/docs/databases.html) for further info
:::


### Display the data using react
The first feature of our app, is displaying the existing data.

Replace the contents of `App.tsx` with the following:

*src/App.tsx*
```tsx
import { useEffect, useState } from "react";
import { remult } from "./common";
import { Task } from "./shared/Task";

const taskRepo = remult.repo(Task);
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    taskRepo.find().then(setTasks);
  }, []);
  return (
    <div >
      {tasks.map(task => (
        <div key={task.id}>
          <input type="checkbox" checked={task.completed} />
          {task.title}
        </div>
      ))}
    </div>
  );
}
export default App;
```

Here's a quick overview of the different parts of the code snippet:

`tasksRepo` is a Remult [Repository](../docs/ref_repository.md) object used to fetch and create Task entity objects.

After the browser refreshes, the list of tasks appears.

## Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `useEffect` hook `App` function component, add an object literal argument to the `find` method call and set its `orderBy` property to an arrow function which accepts a `task` argument and returns its `completed` field.

*src/App.tsx*
```ts{3}
useEffect(() => {
   taskRepo.find({
   orderBy: { completed: "asc" }
   }).then(setTasks);
}, []);
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
### Hide completed tasks
Let's hide all completed tasks, using server side filtering.

1. In the `useEffect` hook of the `App` function component, set the `where` property of the `options` argument of `find` to `{ completed: false }`}.

   *src/App.tsx*
   ```ts{4}
   useEffect(() => {
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: false }
     }).then(setTasks);
   }, []);
   ```
   ::: warning Note
   Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type.**
   :::

### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `App` function component.

   *src/App.tsx*
   ```ts
   const [hideCompleted, setHideCompleted] = useState(false);
   ```

2. In the `useEffect` hook of the `App` function component, change the `where` property of the `options` argument of `find`. Also register the `hideCompleted` in the array that is sent as the second parameter to `useEffect`.

   *src/App.tsx*
   ```ts{3,6}
   useEffect(() => {
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: hideCompleted ? false : undefined }
     }).then(setTasks);
   }, [hideCompleted]);
   ```

3. Add a `checkbox` input element immediately before the `tasks` map in `App.tsx`, bind it to the `hideCompleted` field, and add a `change` handler which sets the `setHideCompleted` when the value of the checkbox is changed.

   *src/App.tsx*
   ```tsx{3-7}
   return (
     <div >
       <input
         type="checkbox"
         checked={hideCompleted}
         onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
       <hr />
       {tasks.map(task => (
         <div key={task.id}>
           <input type="checkbox" checked={task.completed} />
           {task.title}
         </div>
       ))}
     </div>
   );
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.

## CRUD Operations
Let's make the `tasks` updatable, we'll start by adding a `handleChange` method and use an input for the `title` and `completed` fields.
*src/App.tsx*
```tsx{1-3,13-18}
const handleChange = (task: Task, values: Partial<Task>) => {
   setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
}
return (
   <div >
     <input
        type="checkbox"
        checked={hideCompleted}
        onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
     <hr />
     {tasks.map(task => (
        <div key={task.id}>
           <input type="checkbox"
           checked={task.completed}
           onChange={e => handleChange(task, { completed: e.target.checked })}/>
           <input
           value={task.title}
           onChange={e => handleChange(task, { title: e.target.value })} />
        </div>
     ))}
   </div>
);
```

Now, let's add a `save` button that'll save the `entity` to the server.
*src/App.tsx*
```tsx{1-4,20}
const saveTask = async (task: Task) => {
   const savedTask = await taskRepo.save(task);
   setTasks(tasks.map(t => t === task ? savedTask : t));
}
return (
   <div >
     <input
        type="checkbox"
        checked={hideCompleted}
        onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
     <hr />
     {tasks.map(task => (
        <div key={task.id}>
           <input type="checkbox"
           checked={task.completed}
           onChange={e => handleChange(task, { completed: e.target.checked })} />
           <input
           value={task.title}
           onChange={e => handleChange(task, { title: e.target.value })} />
           <button onClick={() => saveTask(task)}>Save</button>
        </div>
     ))}
   </div>
);
```
### Add new Tasks
*src/App.tsx*
```tsx{1-3,22}
const addTask = () => {
   setTasks([...tasks, new Task()])
}
return (
   <div >
     <input
        type="checkbox"
        checked={hideCompleted}
        onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
     <hr />
     {tasks.map(task => (
        <div key={task.id}>
           <input type="checkbox"
           checked={task.completed}
           onChange={e => handleChange(task, { completed: e.target.checked })} />
           <input
           value={task.title}
           onChange={e => handleChange(task, { title: e.target.value })} />
           <button onClick={() => saveTask(task)}>Save</button>
        </div>
     ))}
     <button onClick={addTask}>Add Task</button>
   </div>
);
```

* Note that the task is not saved to the server until you press the `Save` button. The `taskRepo.Save` method knows that this is a new row, because it has no `id`. Alternatively you can adjust it to use the `taskRepo.insert` method.

### Delete a task
*src/App.tsx*
```tsx{1-4,21}
const deleteTask = async (task: Task) => {
  await taskRepo.delete(task);
  setTasks(tasks.filter(t => t !== task));
}
return (
  <div >
    <input
      type="checkbox"
      checked={hideCompleted}
      onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
    <hr />
    {tasks.map(task => (
      <div key={task.id}>
        <input type="checkbox"
          checked={task.completed}
          onChange={e => handleChange(task, { completed: e.target.checked })} />
        <input
          value={task.title}
          onChange={e => handleChange(task, { title: e.target.value })} />
        <button onClick={() => saveTask(task)}>Save</button>
        <button onClick={() => deleteTask(task)}>Delete</button>
      </div>
    ))}
    <button onClick={addTask}>Add Task</button>
  </div>
);
```

### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

Here are the code files we've modified to implement these features.

*src/Task.ts*
```ts
import { Entity, Fields } from "remult";
@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
}
```

*src/App.tsx*
```tsx
import { useEffect, useState } from "react";
import { remult } from "./common";
import { Task } from "./shared/Task";

const taskRepo = remult.repo(Task);
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hideCompleted, setHideCompleted] = useState(false);
  useEffect(() => {
    taskRepo.find({
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
    }).then(setTasks);
  }, [hideCompleted]);
  const handleChange = (task: Task, values: Partial<Task>) => {
    setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
  }
  const saveTask = async (task: Task) => {
    const savedTask = await taskRepo.save(task);
    setTasks(tasks.map(t => t === task ? savedTask : t));
  }
  const addTask = () => {
    setTasks([...tasks, new Task()])
  }
  const deleteTask = async (task: Task) => {
    await taskRepo.delete(task);
    setTasks(tasks.filter(t => t !== task));
  }
  return (
    <div >
      <input
        type="checkbox"
        checked={hideCompleted}
        onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
      <hr />
      {tasks.map(task => (
        <div key={task.id}>
          <input type="checkbox"
            checked={task.completed}
            onChange={e => handleChange(task, { completed: e.target.checked })} />
          <input
            value={task.title}
            onChange={e => handleChange(task, { title: e.target.value })} />
          <button onClick={() => saveTask(task)}>Save</button>
          <button onClick={() => deleteTask(task)}>Delete</button>
        </div>
      ))}
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}

export default App;
```

## Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate the title field

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Fields.string` decorator for the `title` field to include an argument which implements the `FieldOptions` interface. Implement the interface using an object literal and set the object's `validate` property to `Validators.required`.

   *src/Task.ts*
   ```ts{1-3}
    @Fields.string({
        validate: Validators.required
    })
    title = '';
   ```

2. In the `App.tsx` template, adjust the `saveTask` function to catch errors .

   *src/App.tsx*
   ```tsx{2,5-7}
   const saveTask = async (task: Task) => {
     try {
       const savedTask = await taskRepo.save(task);
       setTasks(tasks.map(t => t === task ? savedTask : t));
     } catch (error: any) {
       alert(error.message);
     }
   }
   ```


After the browser refreshes, try creating a new `task` or saving an existing one without title - the "Should not be empty" error message is displayed.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:3002/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:3002/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,

### Displaying the error next to the relevant Input
To create a better UX, let's display the validation error next to the relevant input.
1. Adjust the `tasks` array to also include an optional error
   ```tsx{2,8}
   import { useEffect, useState } from "react";
   import { ErrorInfo } from "remult";
   import { remult } from "./common";
   import { Task } from "./shared/Task";
   
   const taskRepo = remult.repo(Task);
   function App() {
     const [tasks, setTasks] = useState<(Task & { error?: ErrorInfo<Task> })[]>([]);
     const [hideCompleted, setHideCompleted] = useState(false);
   ```
2. Adjust the `saveTask` function to store that error
   ```tsx{6}
   const saveTask = async (task: Task) => {
     try {
       const savedTask = await taskRepo.save(task);
       setTasks(tasks.map(t => t === task ? savedTask : t));
     } catch (error: any) {
       setTasks(tasks.map(t => t === task ? { ...task, error } : t));
     }
   }   
   ```
3. Display the error next to the relevant `input` 
   ```tsx{16}
   return (
     <div >
       <input
         type="checkbox"
         checked={hideCompleted}
         onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
       <hr />
       {tasks.map(task => (
         <div key={task.id}>
           <input type="checkbox"
             checked={task.completed}
             onChange={e => handleChange(task, { completed: e.target.checked })} />
           <input
             value={task.title}
             onChange={e => handleChange(task, { title: e.target.value })} />
           {task.error?.modelState?.title}
           <button onClick={() => saveTask(task)}>Save</button>
           <button onClick={() => deleteTask(task)}>Delete</button>
         </div>
       ))}
       <button onClick={addTask}>Add Task</button>
     </div>
   );   
   ```

## Backend methods
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

1. Create a new `TasksController` class, in the `shared` folder, and refactor the `for await` loop from the `setAll` function of the `App` function component into a new, `static`, `setAll` function in the `TasksService` class,  which will run on the server.

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

3. Call the `setAll` method in the `TasksService`
   *src/App.tsx*
   ```ts{2}
   const setAll = async (completed: boolean) => {
     await TasksController.setAll(completed);
     loadTasks();
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

## Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism which enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field level authorization code should be placed in entity classes**.

User authentication remains outside the scope of Remult. In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

### Tasks CRUD operations require sign in
This rule is implemented within the `Task` entity class constructor, by modifying the `allowApiCrud` property of the anonymous implementation of the argument sent to the `@Entity` decorator, from a `true` value to an arrow function which accepts a Remult `Remult` object and returns the result of the Remult's `authenticated` method.

*src/Task.ts*
```ts{2}
@Entity("tasks", {
    allowApiCrud: Allow.authenticated
})
```

After the browser refreshes, the list of tasks disappeared and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL
```sh
curl -i http://localhost:3002/api/tasks
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `TasksService`.

*src/Task.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
:::

### Load the tasks only if the user is authenticated
Add the following code to the the `useEffect` hook with the following code:

*src/App.tsx*
```tsx{2-3}
useEffect(() => {
  if (taskRepo.metadata.apiReadAllowed)
    taskRepo.find({
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
    }).then(setTasks);
}, [hideCompleted, reload]);
```

### User authentication
Let's add a sign in area to the todo app, with an `input` for typing in a `username` and a sign in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign in, the sign in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [jwt-decode](https://github.com/auth0/jwt-decode) for client-side JWT decoding.
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server



1. Open a terminal and run the following command to install the required packages:
   ```sh
   npm i jsonwebtoken jwt-decode express-jwt
   npm i --save-dev @types/jsonwebtoken @types/express-jwt
   ```
2. Create a file called `src/shared/AuthController.ts ` and place the following code in it:
   *src/shared/AuthController.ts*
   ```ts
   import * as jwt from 'jsonwebtoken';
   import { BackendMethod } from 'remult';

   export class AuthController {
      @BackendMethod({ allowed: true })
      static async signIn(username: string) {
         const validUsers = [
               { id: "1", name: "Jane", roles: [] },
               { id: "2", name: "Steve", roles: [] }
         ];
         const user = validUsers.find(user => user.name === username);
         if (!user)
               throw new Error("Invalid User");
         return jwt.sign(user, getJwtSigningKey());
      }
   }

   export function getJwtSigningKey() {
      if (process.env.NODE_ENV === "production")
         return process.env.TOKEN_SIGN_KEY!;
      return "my secret key";
   }
   ```
   And add it to the `controllers` array on the `server`
   ```ts{5,10}
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController } from '../shared/AuthController';
   
   let app = express();
   app.use(remultExpress({
       entities: [Task],
       controllers: [TasksController, AuthController],
       initApi: async remult => {
       ...
   ```
   * Note that The (very) simplistic `signIn` function will accept a `username` argument, define a dictionary of valid users, check whether the argument value exists in the dictionary and return a JWT string signed with a secret key. 
   
   The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.

3. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{2,63,9-13}
   import express from 'express';
   import expressJwt from 'express-jwt';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtTokenSignKey } from '../shared/AuthController';
   
   let app = express();
   app.use(expressJwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
   ...
   ```

   The `expressJwt` module verifies for each request that the auth token is valid, and extracts the user info from it to be used on the server.


   `credentialsRequired` is set to `false` to allow unauthenticated API requests (e.g. the request to `signIn`).

   The `algorithms` property must contain the algorithm used to sign the JWT (`HS256` is the default algorithm used by `jsonwebtoken`).

4. Add the following code that manages the auth token and includes it in the header of `axios` based requests in the `common.ts` file. The auth token is also stored in the `sessionStorage` to be retrieved when the user reloads the page.

   *src/common.ts*
   ```ts{2,7-27}
   import axios from 'axios';
   import jwtDecode from 'jwt-decode';
   import { Remult } from "remult";

   export const remult = new Remult(axios);

   const AUTH_TOKEN_KEY = "authToken";

   export function setAuthToken(token: string | null) {
      if (token) {
         remult.setUser(jwtDecode(token));
         sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      else {
         remult.setUser(undefined!);
         sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
   }

   // Initialize the auth token from session storage when the application loads
   setAuthToken(sessionStorage.getItem(AUTH_TOKEN_KEY));

   axios.interceptors.request.use(config => {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (token)
         config.headers!["Authorization"] = "Bearer " + token;
      return config;
   });
   ```


5. Exclude `jsonwebtoken` from browser builds by adding the following JSON to the main section of the project's `package.json` file.

   *package.json*
   ```json
   "browser": {
      "jsonwebtoken": false
   }
   ```

   ::: danger This step is not optional
   React CLI will fail to serve/build the app unless `jsonwebtoken` is excluded.

   **For this change to take effect, our React app's dev server must be restarted by terminating the `dev-react` script and running it again.**
   :::

6. Add the following code to the `App` function component, and replace the beginning of the `return` statement to include the user greeting and sign out button.

   *src/App.tsx*
   ```tsx
   const [username, setUsername] = useState("");
   const signIn = async () => {
     setAuthToken(await AuthController.signIn(username));
     setReload({});
   }
   const signOut = () => {
     setAuthToken(null);
     setTasks([]);
   }
   if (!remult.authenticated())
      return (<div>
        <p>
          <input value={username} onChange={e => setUsername(e.target.value)}  />
          <button onClick={signIn}>Sign in</button> <span style={{ color:  'green' }}></span>
        </p>
      </div>);
 
   return (
     <div>
       <p>
         Hi {remult.user.name} <button onClick={signOut}>Sign out </button>
       </p>
       //... the rest of the tsx html part
   ```

   ::: warning Imports
   This code requires imports for `AuthController` from `./shared/AuthController` and `setAuthToken` from the existing import of `./common`.
   :::



The todo app now supports signing in and out, with all access restricted to signed in users only.

### Role-based authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo list, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/shared/` folder, with the following `Roles` class definition:

   *src/shared/Roles.ts*
   ```ts
   export const Roles = {
      admin: 'admin'
   }
   ```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

   *src/Task.ts*
   ```ts{2,5-8,13}
   import { Fields, Entity, IdEntity, Validators, Allow } from "remult";
   import { Roles } from "./Roles";
   
   @Entity("tasks", {
       allowApiRead: Allow.authenticated,
       allowApiUpdate: Allow.authenticated,
       allowApiInsert: Roles.admin,
       allowApiDelete: Roles.admin
   })
   export class Task extends IdEntity {
       @Fields.string({
           validate: Validators.required,
           allowApiUpdate: Roles.admin
       })
       title = '';
       @Fields.boolean()
       completed = false;
   }
   ```
3. Modify the highlighted line in the `TasksController` class to reflect the authorization rule
   *src/shared/TasksController.ts*
   ```ts{3,7}
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./Task";
   import { Roles } from "./Roles";
   
   export class TasksController {
   
       @BackendMethod({ allowed: Roles.admin })
       static async setAll(completed: boolean, remult?: Remult) {
           const taskRepo = remult!.repo(Task);
           for await (const task of taskRepo.query()) {
               await taskRepo.save({ ...task, completed });
           }
       }
   }
   ```

4. Let's have the *"Jane"* belong to the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` server function.

   *src/shared/AuthController.ts*
   ```ts{4}
   @BackendMethod({ allowed: true })
   static async signIn(username: string) {
      const validUsers = [
      { id: "1", name: "Jane", roles: [ Roles.admin] },
      { id: "2", name: "Steve", roles: [] }
      ];
      const user = validUsers.find(user => user.name === username);
      if (!user)
         throw new Error("Invalid User");
      return jwt.sign(user, getJwtSigningKey());
   }
   ```


**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**




## Deployment
In this tutorial, we'll deploy both the React app files and the API server project to the same host, and redirect all non-API requests to return the React app's `index.html` page.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance and [helmet](https://www.npmjs.com/package/helmet) middleware to improve security.

* note that if your project name is different than `remult-react-todo`, you'll need to replace these values in the index.ts file
:::

1. Install `compression` and `helmet`.

   ```sh
   npm i compression helmet
   npm i @types/compression --save-dev
   ```

2. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

   *src/server/index.ts*
   ```ts{2-3,11-12,35-39}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import expressJwt from 'express-jwt';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtTokenSignKey } from '../shared/AuthController';
   
   let app = express();
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressJwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
       entities: [Task],
       controllers: [TasksController, AuthController],
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
   
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile(process.cwd() + '/build/index.html');
   });
   app.listen(process.env.PORT || 3002, () => console.log("Server started"));
   ```

3. Modify the project's `build` npm script to also transpile the API server's TypeScript code to JavaScript (using `tsc`).

   *package.json*
   ```json
   "build": "react-scripts build && tsc -p tsconfig.server.json"
   ```

4. Modify the project's `start` npm script to start the production Node.js server.

   *package.json*
   ```json
   "start": "node dist/server/server/"
   ```

The todo app is now ready for deployment to production.

#### Deploy to heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

For this tutorial, we will use `postgres` as a production database.

1. Install postgres `pg` and `heroku-ssl-redirect` (to enforce https)
   ```sh
   npm i pg heroku-ssl-redirect
   npm i --save-dev @types/pg
   ```

2. Add the highlighted code lines to `src/server/index.ts`.

   *src/server/index.ts*
   ```ts{5-6,13,22-26}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import expressJwt from 'express-jwt';
   import sslRedirect from 'heroku-ssl-redirect'
   import { createPostgresConnection } from 'remult/postgres';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtTokenSignKey } from '../shared/AuthController';
   
   let app = express();
   app.use(sslRedirect());
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressJwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
       dataProvider: async () => {
           if (process.env.NODE_ENV === "production")
               return createPostgresConnection({ configuration: "heroku" })
           return undefined;
       },
       entities: [Task],
       controllers: [TasksController, AuthController],
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
   
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile(process.cwd() + '/build/index.html');
   });
   app.listen(process.env.PORT || 3002, () => console.log("Server started"));
   ```
2. Create a Heroku `app`:

   ```sh
   heroku create
   ```

3. Set the jwt authentication to something random - you can use an [Online UUID Generator](https://www.uuidgenerator.net/)
   ```sh
   heroku config:set TOKEN_SIGN_KEY=some-very-secret-key
   ```
3. Provision a dev postgres database on Heroku
   ```sh
   heroku addons:create heroku-postgresql:hobby-dev
   ```
3. Delete the `yarn.lock` file generated by `react-scripts` - we use npm, and that uses the `package-lock.json` file. When you deploy to her
   ```sh
   del yarn.lock
   ```   

4. Commit the changes to git and deploy to Heroku using `git push`:

   ```sh
   git add .
   git commit -m "todo app tutorial"
   git push heroku master
   ```

5. Run the production app using `heroku apps:open` command: 

   ```sh
   heroku apps:open
   ```
::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::


That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
