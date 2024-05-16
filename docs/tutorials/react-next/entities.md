# Entities

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:

- As a model class for client-side code
- As a model class for server-side code
- By `remult` to generate API endpoints, API queries, and database commands

The `Task` entity class we're creating will have an auto-generated `id` field, a `title` field, a `completed` field and an auto-generated `createdAt` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

## Define the Model

1. Create a `shared` folder under the `src` folder. This folder will contain code shared between frontend and backend.

2. Create a file `Task.ts` in the `shared/` folder, with the following code:

```ts
// src/shared/Task.ts

import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id = ''

  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
```

3. In the `src/api.ts` api route, register the `Task` entity with Remult by adding `entities: [Task]` to an `options` object you pass to the `remultNextApp()` function:

```ts{4,7}
// src/api.ts

import { remultNextApp } from "remult/remult-next"
import { Task } from "./shared/Task"

const api = remultNextApp({
  entities: [Task]
})

export const { POST, PUT, DELETE, GET } = api

```

The [@Entity](../../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an `options` argument used to define entity-related properties and operations, discussed in the next sections of this tutorial.

To initially allow all CRUD operations for tasks, we set the option [allowApiCrud](../../docs/ref_entity.md#allowapicrud) to `true`.

The [@Fields.cuid](../../docs/field-types.md#fields-cuid) decorator tells Remult to automatically generate a short random id using the [cuid](https://github.com/paralleldrive/cuid) library. This value can't be changed after the entity is created.

The [@Fields.string](../../docs/field-types.md#fields-string) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field-related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

The [@Fields.createdAt](../../docs/field-types.md#fields-createdat) decorator tells Remult to automatically generate a `createdAt` field with the current date and time.

::: tip
For a complete list of supported field types, see the [Field Types](../../docs/field-types.md) section in the Remult documentation.
:::

## Test the API

Now that the `Task` entity is defined, we can start using the REST API to query and add a tasks.

1. Open a browser with the url: [http://localhost:3000/api/tasks](http://localhost:3000/api/tasks), and you'll see that you get an empty array.

2. Use `curl` to `POST` a new task - _Clean car_.

```sh
curl http://localhost:3000/api/tasks -d "{\"title\": \"Clean car\"}" -H "Content-Type: application/json"
```

3. Refresh the browser for the url: [http://localhost:3000/api/tasks](http://localhost:3000/api/tasks) and see that the array now contains one item.

4. Use `curl` to `POST` a few more tasks:

```sh
curl http://localhost:3000/api/tasks -d "[{\"title\": \"Read a book\"},{\"title\": \"Take a nap\", \"completed\":true },{\"title\": \"Pay bills\"},{\"title\": \"Do laundry\"}]" -H "Content-Type: application/json"
```

- Note that the `POST` endpoint can accept a single `Task` or an array of `Task`s.

5. Refresh the browser again, to see that the tasks were stored in the db.

::: warning Wait, where is the backend database?
While remult supports [many relational and non-relational databases](https://remult.dev/docs/databases.html), in this tutorial we start by storing entity data in a backend **JSON file**. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::

## Admin UI

### Enabling the Admin UI

Add the Admin UI to your Next.js application by setting the `admin` option to `true` in the `remultNextApp()` configuration in your `src/api.ts` file:

```ts
// src/api.ts

import { remultNextApp } from 'remult/remult-next'
import { Task } from './shared/Task'

const api = remultNextApp({
  entities: [Task],
  admin: true,
})

export const { POST, PUT, DELETE, GET } = api
```

### Accessing and Using the Admin UI

Navigate to `http://localhost:3000/api/admin` to access the Admin UI. Here, you can perform CRUD operations on your entities, view their relationships via the Diagram entry, and ensure secure management with the same validations and authorizations as your application.

![Remult Admin](/remult-admin.png)

### Features

- **CRUD Operations**: Directly create, update, and delete tasks through the Admin UI.
- **Entity Diagram**: Visualize relationships between entities for better data structure understanding.
- **Security**: Operations are secure, adhering to application-defined rules.

## Display the Task List

Let's start developing the web app by displaying the list of existing tasks in a React component.

In the `src` folder create a `components` folder and in it create a `todo.tsx` file and place the following code in it:

```tsx
// src/components/todo.tsx

'use client'
import { useEffect, useState } from 'react'
import { remult } from 'remult'
import { Task } from '../shared/Task'

const taskRepo = remult.repo(Task)

export default function Todo() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    taskRepo.find().then(setTasks)
  }, [])
  return (
    <div>
      <h1>Todos</h1>
      <main>
        {tasks.map((task) => {
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
- React's useEffect hook is used to call the Remult [repository](../../docs/ref_repository.md)'s [find](../../docs/ref_repository.md#find) method to fetch tasks from the server once when the React component is loaded.

### Display the todo Component

Replace the contents of `src/app/page.tsx` with the following code:

```tsx
// src/app/page.tsx

import Todo from '../components/todo'

export default function Home() {
  return <Todo />
}
```

After the browser refreshes, the list of tasks appears.
