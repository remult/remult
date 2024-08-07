---
type: lesson
title: Delete
focus: /frontend/Todo.tsx
---

# Deleting Data

Let's add the functionality to delete a task. We'll start by defining a function to handle the deletion.

```ts add={1-8}
async function deleteTask(task: Task) {
  try {
    await taskRepo.delete(task)
    setTasks(tasks.filter((t) => t.id !== task.id))
  } catch (error: any) {
    alert((error as { message: string }).message)
  }
}

useEffect(() => {
  taskRepo.find().then(setTasks)
}, [])
```

### Code Explanation

- Before the `useEffect` hook we added the `deleteTask` function, which takes a `task` as an argument.
- The `taskRepo.delete` method deletes the given task. This makes a REST API call to the backend to delete the task from the database.
- After deleting the task, we update the `tasks` state by filtering out the deleted task from the list.
- If there's an error, we display an alert with the error message.
- We kept the existing `useEffect` hook to fetch the tasks when the component mounts.

Next, let's modify the JSX to call the `deleteTask` function when the delete button is clicked.

```tsx add={10-12}
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
        <button onClick={() => deleteTask(task)} style={{ marginLeft: 'auto' }}>
          Delete
        </button>
      </div>
    )
  })
}
```

### Code Explanation

- We added a button with an `onClick` handler that calls the `deleteTask` function when the button is clicked.
- The `onClick` handler passes the `task` to the `deleteTask` function.

This code results in the following REST API request to delete the task:
`DELETE /api/tasks/{taskId}`

Try deleting tasks using the delete buttons in the preview window below.
