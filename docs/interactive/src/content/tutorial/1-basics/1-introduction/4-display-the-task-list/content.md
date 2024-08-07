---
type: lesson
title: Display the Task List
focus: /frontend/Todo.tsx
autoReload: true
---

## Display the Task List

Next, we'll use the tasks from the backend and display them in the frontend. We've prepared a `Todo` React component that displays an array of `Task`. Note that we're using the same "shared" `Task` type that we previously used in the backend.

Let's add the following code to display the tasks:

```ts add={3,5,9-11}
import { useEffect, useState } from 'react'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

const taskRepo = repo(Task)

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([])
  useEffect(() => {
    taskRepo.find({}).then(setTasks)
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

### Code Explanation

- We ask Remult for a `Repository` of type `Task` and store it in `taskRepo`. The repository is used to perform all CRUD operations for our tasks.
- Previously, we used a Repository in the `initApi` on the backend to create rows directly in our database. Now, we use the same Repository abstraction on the frontend. When it runs in the frontend, the same methods will perform REST API calls to the backend to get and manipulate the data.
- We use the `find` method of the repository in the `useEffect` hook to get the tasks from the backend and set them in the state.

This code makes a REST API call to the backend at the `/api/tasks` URL to get the tasks and display them.

You can see the tasks in the preview window below.
