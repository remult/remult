# Todo App with React
### Build a production ready task list app with Remult using a React front-end

In this tutorial we are going to create a simple app to manage a task list. We'll use React for the UI, Node + Express for the API server, and Remult as our full-stack framework. For deployment to production, we'll use Heroku and a PostgreSQL database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `React`.

Before you begin, make sure you have [Node.js](https://nodejs.org/en/) installed. <!-- consider specifying Node minimum version with npm -->


## Setup for the Tutorial
This tutorial requires setting up a React project, an API Server project and a few lines of code to add Remult.

:::details TLDR: Follow these steps to skip the manual setup and dive straight into coding the app

1. Clone the [remult-react-todo](https://github.com/remult/remult-react-todo) repository and install its dependencies.
   ```sh
   git clone https://github.com/remult/remult-react-todo.git
   cd remult-react-todo
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

## Create a React Project
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
We  need [axios](https://github.com/axios/axios) for our http requests,  `express` to serve our app's API and, of course, `remult`.
```sh
npm i axios express remult
npm i --save-dev @types/express
```
#### The API server project
The starter API server TypeScript project contains a single module which initializes `Express`, starts Remult and begins listening for API requests.

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
   ::: tip swagger
   You can easily add swagger by following [this article](/blog/adding-swagger.html)
   :::
   ::: tip graphql
   You can easily add swagger by following [this article](/blog/adding-graphql.html)
   :::


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

#### Proxy API requests from Webpack DevServer to Node and run the React app
The React app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the React app is served from `http://localhost:3002`. 

We'll use the feature to divert all calls for `http://localhost:3002/api` to our dev API server.

1. Configure the proxy by adding the following JSON to the main section of the project's package.json file.



   *package.json*
   ```json
   "proxy": "http://localhost:3002",
   ```

2. Create an `npm` script `dev-react` to serve the React app, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-react": "react-scripts start"
   ```

   ::: warning Note
   The existing `start` and `build` npm scripts created by React CLI will be modified in the [Deployment](#deployment) section of this tutorial to scripts that will `start` and `build` the full-stack app.
   :::

3. Add the following flag to the `compilerOptions` section of the `tsconfig.json`
   
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

#### Setting up a React DI Provider for Remult
Our React starter project is almost ready. All that's left is to add for the front-end `Remult` object. The `Remult` object provided will be used to communicate with the API server.

Add a file called `src/common.ts` and place the following content in it:
*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```
We use [axios](https://github.com/axios/axios) for the http requests

### Setup completed
At this point our starter project is up and running. We are now ready to start creating the task list app.

## Entities and CRUD Operations

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints and database commands

The `Task` entity class we're creating will have an `id` field and a `title` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

1. Create a file `Task.ts` in the `src/` folder, with the following code:

   *src/Task.ts*
   ```ts
   import { Field, Entity, IdEntity } from "remult";

   @Entity("tasks", {
      allowApiCrud: true
   })
   export class Task extends IdEntity {
      @Field()
      title: string = '';
   }
   ```

2. Import the `Task` module into the API server's `index` module:

   *src/server/index.ts*
   ```ts
   import '../Task';
   ```

The [@Entity](./ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and database collection/table), and an argument which implements the `EntityOptions` interface. We use an object literal to instantiate it, setting the [allowApiCrud](./ref_entity.md#allowapicrud) property to `true`.

`IdEntity` is a base class for entity classes, which defines a unique string identifier field named `id`. <!-- consider linking to reference -->

The [@Field](./ref_field.md) decorator tells Remult the `title` property is an entity data field. This decorator is also used to define field related properties and operations, discussed in the next sections of this tutorial.

### Create new tasks

The first feature of our app is letting the user create a new task by typing a task title and clicking a button.

Let's implement this feature within the main `App` function.

Add the highlighted code lines to the `App` function file:

*src/App.tsx*
```tsx{2-5,8-9,13-19}
import { useState } from 'react';
import { remult } from './common';
import { Task } from './Task';

const taskRepo = remult.repo(Task);

function App() {
   const [{ newTask }, setNewTask] = useState(() => ({ newTask: taskRepo.create() }));
   const createTask = () => newTask.save().then(() => setNewTask({ newTask: taskRepo.create() }))

   return (
      <div>
         <input value={newTask.title}
            onChange={(e) =>
               setNewTask({
               newTask: newTask.assign({ title: e.target.value })
               })}
         />
         <button onClick={createTask}>Create Task</button>
      </div>
   );
}

export default App;
```

The `tasksRepo` constant variable contains a Remult [Repository](./ref_repository.md) object used to fetch and create `Task` entity objects.

The `remult` field we've add to the `App` function (using a constructor argument), will be instantiated by React's dependency injection. We've declared it as a `public` field so we can use it in the HTML template later on.

The `newTask` field contains a new, empty, instance of a `Task` entity object, instantiated using Remult. 

The `createNewTask` method stores the newly created `task` to the backend database (through an API `POST` endpoint handled by Remult), and the `newTask` member is replaced with a new `Task` object.


### Run and create tasks
Using the browser, create a few new tasks. Then, navigate to the `tasks` API route at <http://localhost:3002/api/tasks> to see the tasks have been successfully stored on the server.

::: warning Wait, where is the backend database?
By default, `remult` stores entity data in a backend JSON database. Notice that a `db` folder has been created under the workspace folder, with a `tasks.json` file that contains the created tasks.
:::


### Display the list of tasks
To display the list of existing tasks, we'll add a `Task` array field to the `App` function, load data from the server, and display it in an unordered list.

1. Add the following code to the `App` function:

   *src/App.tsx*
   ```tsx{4-8,21-26}
   function App() {
     const [{ newTask }, setNewTask] = useState(() => ({ newTask: taskRepo.create() }));
   
     const [tasks, setTasks] = useState([] as Task[]);
   
     const loadTasks = useCallback(() =>
       taskRepo.find().then(tasks => setTasks(tasks)), []);
     useEffect(() => { loadTasks() }, [loadTasks]);
   
     const createTask = () => newTask.save().then(() => setNewTask({ newTask: taskRepo.create() }))
     return (
       <div>
   
         <input value={newTask.title}
           onChange={(e) =>
             setNewTask({
               newTask: newTask.assign({ title: e.target.value })
             })}
         />
         <button onClick={createTask}>Create Task</button>
         <ul>
           {tasks.map(task => (
               <li key={task.id}>
                    {task.title}
               </li>))}
         </ul>
   
       </div>
     );
   }
   ```
::: danger Import useCallback
Don't forget to import `useCallback` and `useEffect` from `react` for this code to work.
:::
3. To refresh the list of tasks after a new task is created, add a `loadTasks` method call to the `createNewTask` method of the `App` function.

   *src/App.tsx*
   ```ts{3}
   const createTask = () => newTask.save()
     .then(() => setNewTask({ newTask: taskRepo.create() }))
     .then(loadTasks);
   ```

After the browser refreshes, the list of `tasks` appears. Create a new `task` and it's added to the list.

### Delete tasks
Let's add a `Delete` button next to each task on the list, which will delete that task in the backend database and refresh the list of tasks.

1. Add the following `deleteTask` method to the `App` function.

   *src/App.tsx*
   ```ts
   const deleteTask = (task: Task) => task.delete().then(loadTasks);
   ```

2. Add the `Delete` button to the task list item template element in `App.tsx`.

   *src/App.tsx*
   ```tsx{5}
   <ul>
     {tasks.map(task => (
         <li key={task.id}>
             {task.title}
             <button onClick={() => deleteTask(task)}>Delete</button>
         </li>))}
   </ul>
   ```

After the browser refreshes, a `Delete` button appears next to each task in the list. Delete a `task` by clicking the button.

### Making the task titles editable
To make the titles of the tasks in the list editable, let's add a new React element called `TaskEditor` and use it in our `App` function.
The `TaskEditor` will have an html `input` for the titles, and the `Save` button to save the changes to the backend database. We'll use the `wasChanged` method of the entity class to disable the `Save` button while there are no changes to save.

1. Create a file called `src/TaskEditor.tsx`, and place the following code in it:
   ```tsx
   import { useEffect, useState } from "react"
   import { Task } from "./Task"

   export const TaskEditor: React.FC<{ task: Task }> = (props) => {
      const [{ task }, setTask] = useState(props);
      useEffect(() => setTask(props), [props]);
      const save = () => task.save().then(task => setTask({ task }));
      return <span>
         <input
               value={task.title}
               onChange={e =>
                  setTask({ task: task.assign({ title: e.target.value }) })
               }
         />
         <button onClick={() => save()}
               disabled={!task._.wasChanged()}
         >save</button>
      </span>
   }
   ```

Replace the task `title` template expression in `App.tsx` with the highlighted lines:

*src/App.tsx*
```tsx{3}
<ul>
    {tasks.map(task => (<li key={task.id}>
        <TaskEditor task={task} />
        <button onClick={() => deleteTask(task)}>Delete</button>
    </li>))}
</ul>
```
::: danger Import TaskEditor
Don't forget to import `TaskEditor` from `./TaskEditor.ts` for this code to work.
```ts
import { TaskEditor } from './TaskEditor';
```
:::

### Mark tasks as completed
Let's add a new feature - marking tasks in the todo list as completed using a `checkbox`. Titles of tasks marked as completed should have a `line-through` text decoration.

1. Add a `completed` field of type `boolean` to the `Task` entity class, and decorate it with the `@Field` decorator.

   *src/Task.ts*
   ```ts
   @Field()
   completed: boolean = false;
   ```

2. Add a an html `input` of type `checkbox` to the `TaskEditor`. 
   
   Set the `text-decoration` style attribute expression of the task `title` input element to evaluate to `line-through` when the value of `completed` is `true`.

   *src/TaskEditor.tsx*
   ```tsx{2-8,14}
   return <span>
        <input
            checked={task.completed}
            type="checkbox"
            onChange={e =>
                setTask({ task: task.assign({ completed: e.target.checked }) })
            }
        />
        <input
            value={task.title}
            onChange={e =>
                setTask({ task: task.assign({ title: e.target.value }) })
            }
            style={{ textDecoration: task.completed ? 'line-through' : undefined! }}
        />
        <button onClick={() => save()}
            disabled={!task._.wasChanged()}
        >save</button>
    </span>
   ```

After the browser refreshes, a checkbox appears next to each task in the list. Mark a few tasks as completed using the checkboxes.

::: tip
To save the change of `task.completed` immediately when the user checks or unchecks the checkbox, simply add a `change` event handler to the checkbox element and call `task.save()`.
:::

### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

Here are the code files we've modified to implement these features.

*src/Task.ts*
```ts
import { Field, Entity, IdEntity } from "remult";

@Entity("tasks", {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Field()
    title: string = '';
    @Field()
    completed: boolean = false;
}
```

*src/App.tsx*
```tsx
import { useCallback, useEffect, useState } from 'react';
import { remult } from './common';
import { Task } from './Task';
import { TaskEditor } from './TaskEditor';

const taskRepo = remult.repo(Task);

function App() {
  const [{ newTask }, setNewTask] = useState(() => ({ newTask: taskRepo.create() }));

  const [tasks, setTasks] = useState([] as Task[]);

  const loadTasks = useCallback(() =>
    taskRepo.find().then(tasks => setTasks(tasks)), []);
  useEffect(() => { loadTasks() }, [loadTasks]);

  const createTask = () => newTask.save()
    .then(() => setNewTask({ newTask: taskRepo.create() }))
    .then(loadTasks);

  const deleteTask = (t: Task) => t.delete().then(loadTasks);

  return (
    <div>

      <input value={newTask.title}
        onChange={(e) =>
          setNewTask({
            newTask: newTask.assign({ title: e.target.value })
          })}
      />
      <button onClick={createTask}>Create Task</button>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <TaskEditor task={task} />
            <button onClick={() => deleteTask(task)}>Delete</button>
          </li>))}
      </ul>

    </div>
  );
}

export default App;
```

*src/TaskEditor.tsx*
```tsx
import { useEffect, useState } from "react"
import { Task } from "./Task"

export const TaskEditor: React.FC<{ task: Task }> = (props) => {
    const [{ task }, setTask] = useState(props);
    useEffect(() => setTask(props), [props]);
    const save = () => task.save().then(task => setTask({ task }));
    return <span>
        <input
            checked={task.completed}
            type="checkbox"
            onChange={e =>
                setTask({ task: task.assign({ completed: e.target.checked }) })
            }
        />
        <input
            value={task.title}
            onChange={e =>
                setTask({ task: task.assign({ title: e.target.value }) })
            }
            style={{ textDecoration: task.completed ? 'line-through' : undefined! }}
        />
        <button onClick={() => save()}
            disabled={!task._.wasChanged()}
        >save</button>
    </span>
}
```

## Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `loadTasks` method of the `App` function, add an object literal argument to the `find` method call and set its `orderBy` property to an arrow function which accepts a `task` argument and returns its `completed` field.

*src/App.tsx*
```ts
const loadTasks = useCallback(() =>
  taskRepo.find({
    orderBy: { completed: "asc" }
  }).then(tasks => setTasks(tasks)), []);
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
### Hide completed tasks
Let's hide all completed tasks, using server side filtering.

1. In the `loadTasks` method of the `App` function, set the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)`.

   *src/App.tsx*
   ```ts{4}
   const loadTasks = useCallback(() =>
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: false }
     }).then(tasks => setTasks(tasks)), []);
   ```
   ::: warning Note
   Because the `completed` field is of type `boolean`, the argument of its `isEqualTo` method is **compile-time checked to be of the `boolean` type.**
   :::

### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `App` function.

   *src/App.tsx*
   ```ts
   const [hideCompleted, setHideCompleted] = useState(false);
   ```

2. In the `loadTasks` method of the `App` function, change the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter if the `hideCompleted` field is `true`, also register the `hideCompleted` in the array that is sent as the second parameter to `useCallback`.

   *src/App.tsx*
   ```ts{4-5}
   const loadTasks = useCallback(() =>
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: hideCompleted ? { completed: false } : {}
     }).then(tasks => setTasks(tasks)), [hideCompleted]);
   ```

3. Add a `checkbox` input element immediately before the unordered list element in `App.tsx`, bind it to the `hideCompleted` field, and add a `change` handler which calls `loadTasks` when the value of the checkbox is changed.

   *src/App.tsx*
   ```tsx{10-18}
   return (
     <div>
       <input value={newTask.title}
         onChange={(e) =>
           setNewTask({
             newTask: newTask.assign({ title: e.target.value })
           })}
       />
       <button onClick={createTask}>Create Task</button>
       <input
         id="hideCompleted"
         type="checkbox"
         checked={hideCompleted}
         onChange={e =>
           setHideCompleted(e.target.checked)
         }
       />
       <label htmlFor="hideCompleted">Hide completed</label>
       <ul>
         {tasks.map(task => (
           <li key={task.id}>
             <TaskEditor task={task} />
             <button onClick={() => deleteTask(task)}>Delete</button>
           </li>))}
       </ul>
       </div>
   );
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.

## Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate task title length

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Field` decorator for the `title` field to include an argument which implements the `ColumnOptions` interface. Implement the interface using an anonymous object and set the object's `validate` property to `Validators.required`.

   *src/Task.ts*
   ```ts{1-3}
    @Field({
        validate: Validators.required
    })
    title: string = '';
   ```

2. In the `App.tsx` template, add a `div` element immediately after the `div` element containing the new task title `input`. Set an `ngIf` directive to display the new `div` only if `newTask.$.title.error` is not `undefined` and place the `error` text as its contents.

   *src/App.tsx*
   ```tsx
   <div>
     {newTask.$.title.error}
   </div>
   ```
3. We'll also need to adjust the `createTask` method to rerender the component
   ```tsx{4}
   const createTask = () => newTask.save()
     .then(() => setNewTask({ newTask: taskRepo.create() }))
     .then(loadTasks)
     .catch(() => setNewTask({ newTask }));
   ```

After the browser refreshes, try creating a new `task` without title - the "Should not be empty" error message is displayed.

Attempting to modify titles of existing tasks to invalid values will also fail, but the error message is not displayed because we haven't added the template element to display it.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:3002/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:3002/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,


## Backend methods
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

### Set all tasks as un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAll` async function to the `App` function, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/App.tsx*
   ```ts
   const setAll = async (completed: boolean) => {
     for await (const task of taskRepo.iterate()) {
       task.completed = completed;
       await task.save();
     }
     loadTasks();
   }
   ```

   The `iterate` method is an alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects. The `iterate` method doesn't return an array (as the `find` method) and instead returns an `iteratable` object which supports iterations using the JavaScript `for await` statement.


2. Add the two buttons to the `App.tsx` template, immediately before the unordered list element. Both of the buttons' `click` events will call the `setAll` function with the relevant value of the `completed` argument.

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

1. Create a new `TasksService` class and refactor the `for await` loop from the `setAll` function of the `App` function into a new, `static`, `setAll` function in the `TasksService` class,  which will run on the server.

   *src/TasksService.ts*
   ```ts
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./Task";
   
   export class TasksService {
   
       @BackendMethod({ allowed: true })
       static async setAll(completed: boolean, remult?: Remult) {
           for await (const task of remult!.repo(Task).iterate()) {
               task.completed = completed;
               await task.save();
           }
       }
   }
   ```

2. Import the `Task` module into the API server's `index` module:

   *src/server/index.ts*
   ```ts
   import '../TasksService';
   ```

3. Call the `setAll` method in the `TasksService`
   *src/App.tsx*
   ```ts{2}
   const setAll = async (completed: boolean) => {
     await TasksService.setAll(completed);
     loadTasks();
   }
   ```
   ::: danger Import TasksService
   Don't forget to import `TasksService`.
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
This rule is implemented within the `Task` entity class constructor, by modifying the `allowApiCrud` property of the anonymous implementation of the argument sent to the `@Entity` decorator, from a `true` value to an arrow function which accepts a Remult `Remult` object and returns the result of the remult's `authenticated` method.

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
replace the loadTasks method with the following code:

*src/App.tsx*
```tsx{2}
const loadTasks = useCallback(() => {
  if (remult.authenticated())
    taskRepo.find({
      orderBy: { completed: "asc" },
      where: hideCompleted ? { completed: false } : {}
    }).then(tasks => setTasks(tasks));
}, [hideCompleted]);
```

### User authentication
Let's add a sign in area to the todo app, with an `input` for typing in a `username` and a sign in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign in, the sign in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [jwt-decode](hhttps://github.com/auth0/jwt-decode) for client-side JWT decoding.
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server



1. Open a terminal and run the following command to install the required packages:
   ```sh
   npm i jsonwebtoken jwt-decode  express-jwt
   npm i --save-dev  @types/jsonwebtoken @types/express-jwt
   ```
2. Create a file called `src/app/AuthService.ts ` and place the following code in it:
   *src/AuthService.ts*
   ```ts
   import jwtDecode from 'jwt-decode';
   import * as jwt from 'jsonwebtoken';
   import { BackendMethod, Remult } from 'remult';

   export class AuthService {

   @BackendMethod({ allowed: true })
   static async signIn(username: string) {
      const validUsers = [
         { id: "1", name: "Jane", roles: [] },
         { id: "2", name: "Steve", roles: [] }
      ];
      const user = validUsers.find(user => user.name === username);
      if (!user)
         throw new Error("Invalid User");
      return jwt.sign(user, getJwtTokenSignKey());
   }

   async signIn(username: string) {
      this.setAuthToken(await AuthService.signIn(username));
   }
   setAuthToken(token: string) {
      this.remult.setUser(jwtDecode(token));
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
   }
   signOut() {
      this.remult.setUser(undefined!);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
   }

   static fromStorage(): string {
      return sessionStorage.getItem(AUTH_TOKEN_KEY)!;
   }

   constructor(private remult: Remult) {
      const token = AuthService.fromStorage();
      if (token) {
         this.setAuthToken(token);
      }
   }
   }

   export function getJwtTokenSignKey() {
   if (process.env.NODE_ENV === "production")
      return process.env.TOKEN_SIGN_KEY!;
   return "my secret key";
   }

   const AUTH_TOKEN_KEY = "authToken";
   ```
   * Note that tThe (very) simplistic `signIn` function will accept a `username` argument, define a dictionary of valid users, check whether the argument value exists in the dictionary and return a JWT string signed with a secret key. 
   
   The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.

3. Exclude `jsonwebtoken` from browser builds by adding the following JSON to the main section of the project's `package.json` file.

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
4. To use `axios` for the http client used by `remult` replace the code in the `common.ts` file with the following code.

   *src/common.ts*
   ```ts
   import axios from 'axios';
   import { Remult } from "remult";
   import { AuthService } from "./AuthService";
   
   axios.interceptors.request.use(config => {
       const token = AuthService.fromStorage();;
       if (token)
           config.headers!["Authorization"] = "Bearer " + token;
       return config;
   });
   export const remult = new Remult(axios);
   
   export const auth = new AuthService(remult);
   ```
   ::: warning Imports
   This code requires imports for `AuthService` from `./AuthService` and `JwtModule` from `@auth0/react-jwt`.
   :::
5. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{2-3,9-13}
   import express from 'express';
   import expressJwt from 'express-jwt';
   import { getJwtTokenSignKey } from '../AuthService';
   import { remultExpress } from 'remult/remult-express';
   import '../Task';
   import '../TasksService';
   
   const app = express();
   app.use(expressJwt({
       secret: getJwtTokenSignKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress());
   app.listen(3002, () => console.log("Server started"));
   ```

   `credentialsRequired` is set to `false` to allow unauthenticated API requests (e.g. the request to `signIn`).

   The `algorithms` property must contain the algorithm used to sign the JWT (`HS256` is the default algorithm used by `jsonwebtoken`).

6. Add the following code to the `App` function, and replace the start of the `return` statement, .

   *src/App.tsx*
   ```tsx
   const [username, setUsername] = useState("");
   const signIn = () => 
     auth.signIn(username).then(loadTasks);
   
   const signOut = () => {
     auth.signOut();
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
       ... the rest of the tsx html part
   ```

   ::: warning Imports
   This code requires imports for `auth` from the existing import of `./common`.
   :::



The todo app now supports signing in and out, with all access restricted to signed in users only.

### Role-based authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo list, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/app/` folder, with the following `Roles` class definition:

   *src/Roles.ts*
   ```ts
   export const Roles = {
      admin: 'admin'
   }
   ```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

   *src/Task.ts*
   ```ts{2,5-8,13}
   import { Field, Entity, IdEntity, Validators, BackendMethod, Remult, Allow } from "remult";
   import { Roles } from "./Roles";
   
   @Entity("tasks", {
       allowApiRead: Allow.authenticated,
       allowApiUpdate: Allow.authenticated,
       allowApiInsert: Roles.admin,
       allowApiDelete: Roles.admin
   })
   export class Task extends IdEntity {
       @Field({
           validate: Validators.required,
           allowApiUpdate: Roles.admin
       })
       title: string = '';
       @Field()
       completed: boolean = false;
   }

   ```
3. Modify the highlighted line in the `TasksService` class to reflect the authorization rule
   *src/TasksService.ts*
   ```ts{3,7}
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./Task";
   import { Roles } from "./Roles";
   
   export class TasksService {
   
       @BackendMethod({ allowed: Roles.admin })
       static async setAll(completed: boolean, remult?: Remult) {
           for await (const task of remult!.repo(Task).iterate()) {
               task.completed = completed;
               await task.save();
           }
       }
   }
   ```

4. Let's have the *"Jane"* belong to the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` server function.

   *src/AuthService.ts*
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
      return jwt.sign(user, getJwtTokenSignKey());
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
   ```ts{3-4,11-12,19-23}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import expressJwt from 'express-jwt';
   import { getJwtTokenSignKey } from '../AuthService';
   import { remultExpress } from 'remult/remult-express';
   import '../Task';
   import '../TasksService';
   
   const app = express();
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressJwt({
       secret: getJwtTokenSignKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress());
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile('./build/index.html');
   });
   app.listen(process.env.PORT || 3002, () => console.log("Server started"));
   ```

3. Modify the project's `build` npm script to also transpile the API server's TypeScript code to JavaScript (using `tsc`).

   *package.json*
   ```json
   "build": "react-scripts build && tsc -p tsconfig.server.json"
   ```

4. Modify the project's `start` npm script to start the production Node server.

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
   ```ts{5-6,13,21-28}
   import express from 'express';
   import compression from 'compression';
   import helmet from 'helmet';
   import expressJwt from 'express-jwt';
   import sslRedirect from 'heroku-ssl-redirect'
   import { createPostgresConnection } from 'remult/postgres';
   import { getJwtTokenSignKey } from '../AuthService';
   import { remultExpress } from 'remult/remult-express';
   import '../Task';
   import '../TasksService';
   
   const app = express();
   app.use(sslRedirect());
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressJwt({
       secret: getJwtTokenSignKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   const dataProvider = async () => {
       if (process.env.NODE_ENV === "production")
           return createPostgresConnection({ configuration: "heroku" })
       return undefined;
   }
   app.use(remultExpress({
       dataProvider
   }));
   app.use(express.static('build'));
   app.use('/*', async (req, res) => {
       res.sendFile('./build/index.html');
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
