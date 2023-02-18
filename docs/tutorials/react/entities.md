# Entities

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:

- As a model class for client-side code
- As a model class for server-side code
- By `remult` to generate API endpoints, API queries, and database commands

The `Task` entity class we're creating will have an auto-increment `id` field a `title` field and a `completed` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

## Define the Model

1. Create a `shared` folder under the `src` folder. This folder will contain code shared between frontend and backend.

2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

_src/shared/Task.ts_

```ts
import { Entity, Fields } from "remult"

@Entity("tasks", {
  allowApiCrud: true
})
export class Task {
  @Fields.autoIncrement()
  id = 0

  @Fields.string()
  title = ""

  @Fields.boolean()
  completed = false
}
```

3. In the server's `api` module, register the `Task` entity with Remult by adding `entities: [Task]` to an `options` object you pass to the `remultExpress()` middleware:

_src/server/api.ts_

```ts{2,5}
import { remultExpress } from "remult/remult-express"
import { Task } from "../shared/Task"

export const api = remultExpress({
  entities: [Task]
})
```

The [@Entity](../../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an `options` argument used to define entity-related properties and operations, discussed in the next sections of this tutorial.

To initially allow all CRUD operations for tasks, we set the option [allowApiCrud](../../docs/ref_entity.md#allowapicrud) to `true`.

The `@Fields.autoIncrement` decorator tells Remult to automatically generate an id using the databases's auto increment capabilities.

The [@Fields.string](../../docs/ref_field.md) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field-related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

## Test the api

Now that the `Task` entity is defined, we can start using the `api` to query and add a few tasks

1. Open a browser with the url: [http://localhost:3002/api/tasks](http://localhost:3002/api/tasks), and you'll see that you get an empty array.
2. Open a new terminal window and Use `curl` to `POST` a new task
   1. **clean Car**
   ```sh
   curl http://localhost:3002/api/tasks -d "{\"title\": \"Clean car\"}" -H "Content-Type: application/json"
   ```
3. Refresh the browser for the url: [http://localhost:3002/api/tasks](http://localhost:3002/api/tasks) and see that the array now contains one item.
4. Use `curl` to `POST` several more tasks
   1. Read a book
   2. Take a nap (completed)
   3. Pay bills
   4. Do laundry
   ```sh
   curl http://localhost:3002/api/tasks -d "[{\"title\": \"Read a book\"},{\"title\": \"Take a nap\", \"completed\":true },{\"title\": \"Pay bills\"},{\"title\": \"Do laundry\"}]" -H "Content-Type: application/json"
   ```
   - Note that the `POST` route can accept a `Task` or an array of `Tasks` to insert many tasks
5. Use the browser again, to see that the tasks were stored in the db.

::: warning Wait, where is the backend database?
While remult supports [many relational and non-relational databases](https://remult.dev/docs/databases.html), in this tutorial we start by storing entity data in a backend **JSON file**. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::

## Display the Task List

Let's start developing the web app by displaying the list of existing tasks in a React component.

Replace the contents of `src/App.tsx` with the following code:

_src/App.tsx_

```tsx
import { useEffect, useState } from "react"
import { remult } from "remult"
import { Task } from "./shared/Task"

const taskRepo = remult.repo(Task)

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    taskRepo.find().then(setTasks)
  }, [])
  return (
    <div>
      <h1>Todos</h1>
      <main>
        {tasks.map(task => {
          return (
            <div key={task.id}>
              <input type="checkbox" checked={task.completed} />
              {task.title}
            </div>
          )
        })}
      </main>
    </div>
  )
}
```

Here's a quick overview of the different parts of the code snippet:

- `taskRepo` is a Remult [Repository](../../docs/ref_repository.md) object used to fetch and create Task entity objects.
- `tasks` is a Task array React state to hold the list of tasks.
- React's useEffect hook is used to call the Remult [repository](../../docs/ref_repository.md)'s [find](../../docs/ref_repository.md#find) method to fetch tasks from the server, once when the React component is loaded.

After the browser refreshes, the list of tasks appears.
