---
type: lesson
title: Insert Data on the Backend
focus: /backend/index.ts
template: before-frontend
---

## Insert Data on the Backend

Next, we'll add some tasks on the backend so we can use them later.

```ts title="backend/index.ts" add={4,9-21}
import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

export const app = express()
export const api = remultApi({
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

- We added the `initApi` option to the `remultApi` configuration.
- `initApi` is an asynchronous function that runs once when the server is loaded and the API is ready. It allows us to perform initial setup tasks for the API.
- We use the `repo` function to get the repository for the `Task` entity. The line `const taskRepo = repo(Task)` gets a Repository of type `Task` that we'll use to perform all CRUD operations relevant to `Task`.
- The `if ((await taskRepo.count()) === 0)` check ensures that if there are no tasks in the database, we insert a few default tasks to get started.
- The `taskRepo.insert([...])` operation inserts an array of tasks into the database if it's initially empty, providing some sample data to work with.

### See That It Works

Click on the `Test the API` button in the preview window. You should see a JSON array with the tasks we defined in the result.

> **Note:** While Remult supports [many relational and non-relational databases](https://remult.dev/docs/installation/database/), in this tutorial we start by storing entity data in a backend **JSON file** stored in the `db` folder for the project. Later in this tutorial, we'll switch to using SQLite.
