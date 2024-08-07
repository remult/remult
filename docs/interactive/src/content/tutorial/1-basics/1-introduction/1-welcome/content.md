---
type: lesson
title: Welcome to Remult Tutorial
focus: /shared/Task.ts
---

# Welcome to the Remult Tutorial

Hey there, and welcome to the Remult Tutorial 👋!

Remult is a full-stack JavaScript library that greatly simplifies the development of data entry applications. It includes:

- Backend ORM
- Zero-boilerplate CRUD Rest & Realtime API
- Frontend type-safe API client
- TypeScript entities as a single source of truth (SSO) for:
  - Authorization
  - Validation
  - Entity-related business logic

By following the principles of SSO, Remult makes CRUD application development much simpler.

## The Entity

In Remult, the core element is an `entity`. An entity represents a business object, such as an order or customer. In our tutorial, we'll use a `Task` entity for our todo application.

Here's the code for the entity we'll use:

```ts
import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.uuid()
  id = ''

  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
```

### Code Explanation

- `@Entity('tasks', { allowApiCrud: true })` defines the `Task` entity and configures it to allow all CRUD operations - later we'll restrict that using authorization.
- `@Fields.uuid()` generates a unique ID for each task.
- `@Fields.string()` and `@Fields.boolean()` define the `title` and `completed` fields, respectively.
- `@Fields.createdAt()` automatically sets the creation date.

This entity will be used to define the database, API, frontend query language, validation, authorization, and any other definition that revolves around the `task`.

We've placed the entity's source code in the `shared` folder to indicate that it's shared between the frontend and the backend.

## Configuring the Server

For this tutorial, we'll use Express (Remult works with many JavaScript servers including Express, Fastify, Next.js, Sveltekit, nuxt.js, Hapi, Hono, Nest, and Koa).

Open `backend/index.ts` and add the following lines to include the `Task` in the REST API:

```ts add={2,3,6-9}
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task'

export const app = express()
export const api = remultExpress({
  entities: [Task],
})
app.use(api)
```

### Code Explanation

- We import the necessary modules: `express` for creating the server and `remultExpress` for integrating Remult with Express.
- We import the `Task` entity from the `shared` folder.
- We use the `remultExpress` function to set up the Remult REST API and register the `Task` entity in its `entities` array.
- Finally, we tell Express to use the API with `app.use(api)`.

### See that it works

Click the `Toggle Terminal` button. In the terminal, you'll see the line `[remult] /api/tasks`, indicating that the `Task` entity is successfully registered for the REST API using the key `tasks` defined in the entity.

## Adding Some Tasks

Next, we'll add some tasks on the backend so we can use them later.

```ts add={4,8-21}
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task'
import { repo } from 'remult'

export const app = express()
export const api = remultExpress({
  entities: [Task],
  initApi: async () => {
    const taskRepo = repo(Task)
    if ((await taskRepo.count()) === 0) {
      await taskRepo.insert([
        { title: 'Clean car' },
        { title: 'Read a book' },
        { title: 'Buy groceries', completed: true },
        { title: 'Do laundry' },
        { title: 'Cook dinner', completed: true },
        { title: 'Walk the dog' },
      ])
    }
  },
})

app.use(api)
```

### Code Explanation

- We added the `initApi` option to the `remultExpress` configuration.
- `initApi` is an asynchronous function that runs once when the server is loaded and the API is ready. It allows us to perform initial setup tasks for the API.
- We use the `repo` function to get the repository for the `Task` entity. The line `const taskRepo = repo(Task)` gets a Repository of type `Task` that we'll use to perform all CRUD operations relevant to `Task`.
- The `if ((await taskRepo.count()) === 0)` check ensures that if there are no tasks in the database, we insert a few default tasks to get started.
- The `taskRepo.insert([...])` operation inserts an array of tasks into the database if it's initially empty, providing some sample data to work with.

### See that it works

Click the `/api/tasks` link in the preview. This will navigate to the tasks API URL, where you'll see the REST API result.

Right-click the preview window and select "Back" to return to the React application.
