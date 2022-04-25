# Entities 

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints, API queries and database commands

The `Task` entity class we're creating will have an auto generated uuid `id` field a `title` field and a `completed` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.
1. Create a directory called `shared` in the `src` directory - in this folder we'll place code that is shared by the frontend and backend.
2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

   *src/shared/Task.ts*
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
