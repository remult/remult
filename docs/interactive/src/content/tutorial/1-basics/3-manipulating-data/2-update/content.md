---
type: lesson
title: Update
focus: /frontend/Todo.tsx
---

# Updating Data

Let's add the functionality to update a task's completion status. We'll start by defining a function to handle the update.

```ts add={1-4}
async function setCompleted(task: Task, completed: boolean) {
  const updatedTask = await taskRepo.update(task, { completed })
  setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
}
useEffect(() => {
  taskRepo.find().then(setTasks)
}, [])
```

### Code Explanation

- Before the `useEffect` hook we added the `setCompleted` function, which takes a `task` and a `completed` status as arguments.
- The `taskRepo.update` method updates the `completed` status of the given task. This makes a REST API call to the backend to update the task in the database.
- After updating the task, we update the `tasks` state with the updated task, replacing the old task in the list.

Next, let's modify the JSX to call the `setCompleted` function when the checkbox is toggled.

```tsx add={7}
{
  tasks.map((task) => {
    return (
      <div key={task.id}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => setCompleted(task, e.target.checked)}
        />
        {task.title}
      </div>
    )
  })
}
```

### Code Explanation

- We added an `onChange` handler to the checkbox input that calls the `setCompleted` function when the checkbox is toggled.
- The `onChange` handler passes the `task` and the new `checked` status of the checkbox to the `setCompleted` function.

This code results in the following REST API request to update the task:
`PUT /api/tasks/{taskId}`

Try toggling the completion status of tasks using the checkboxes in the preview window below.
