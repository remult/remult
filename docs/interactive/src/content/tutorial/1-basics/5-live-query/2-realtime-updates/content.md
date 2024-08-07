---
type: lesson
title: Realtime Updates
focus: /frontend/Todo.tsx
---

# Realtime Updates

To enable real-time updates, we'll modify the `useEffect` hook to use `liveQuery`.

```ts add={2-6}
useEffect(() => {
  return taskRepo.liveQuery().subscribe((info) => setTasks(info.applyChanges))
}, [])
```

### Code Explanation

- We use the `liveQuery` method from `taskRepo` to subscribe to real-time updates for tasks.
- The `subscribe` method listens for changes and updates the state with `info.applyChanges`.
- We return the result of `subscribe` from the `useEffect` hook, so that once the component unmounts, it will automatically unsubscribe from the updates.

### Try It Out

Try making changes as `user-a` in the preview and see the effect on `user-b`. You'll notice that changes made by one user are immediately reflected for the other user without the need to reload the page.

### Implementation Details

- The real-time updates implementation is adapter-based. The default implementation used for development and up to several hundreds of users uses Server-Sent Events (SSE).
- There are multiple adapters available to use other technologies, including third-party providers such as Ably.

### Simplifying State Management

Now that we can rely on `liveQuery`, we no longer need to manually update the `tasks` state, as `liveQuery` will handle that for us.

```ts add={7,16,22}
async function addTask(e: FormEvent) {
  e.preventDefault()
  try {
    const newTask = await taskRepo.insert({
      title: newTaskTitle,
    })
    // setTasks([...tasks, newTask]);  <-- this line is no longer needed
    setNewTaskTitle('')
  } catch (error: any) {
    alert((error as { message: string }).message)
  }
}

async function setCompleted(task: Task, completed: boolean) {
  const updatedTask = await taskRepo.update(task, { completed })
  // setTasks(tasks.map((t) => t.id === updatedTask.id ? updatedTask : t));  <-- these lines are no longer needed
}

async function deleteTask(task: Task) {
  try {
    await taskRepo.delete(task)
    // setTasks(tasks.filter((t) => t.id !== task.id));  <-- these lines are no longer needed
  } catch (error: any) {
    alert((error as { message: string }).message)
  }
}
```

### Code Explanation

- In the `addTask`, `setCompleted`, and `deleteTask` functions, we removed the lines that manually update the `tasks` state.
- With `liveQuery`, the state updates automatically whenever there are changes to the tasks, simplifying our state management.
