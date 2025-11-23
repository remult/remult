---
type: lesson
title: Updating Multiple Tasks
focus: /frontend/Todo.tsx
---

# Backend Methods

When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring.**

## Set All Tasks as Completed or Uncompleted

Let's add two buttons to the todo app: "Set All Completed" and "Set All Uncompleted".

### Step 1: Add the `setAllCompleted` Function

Add a `setAllCompleted` async function to the `Todo` function component, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

```tsx title="frontend/Todo.tsx" add={1-6}
async function setAllCompleted(completed: boolean) {
  for (const task of await taskRepo.find()) {
    await taskRepo.update(task, {completed });
  }
}
useEffect(...)
```

### Code Explanation

- The `setAllCompleted` function iterates through the array of `Task` objects returned from the backend and saves each task back to the backend with a modified value in the `completed` field.

### Step 2: Add Buttons to the `Todo` Component

Add the two buttons to the return section of the `Todo` component, just before the closing `</main>` tag. Both of the buttons' `onClick` events will call the `setAllCompleted` method with the appropriate value of the `completed` argument.

```tsx title="frontend/Todo.tsx" add={1-4}
<div>
  <button onClick={() => setAllCompleted(true)}>Set All Completed</button>
  <button onClick={() => setAllCompleted(false)}>Set All Uncompleted</button>
</div>
</main>
```

### Code Explanation

- We added two buttons with `onClick` handlers that call the `setAllCompleted` function with `true` or `false`, respectively, to set all tasks as completed or uncompleted.

### Try It Out

Make sure the buttons are working as expected before moving on to the next step. Click the "Set All Completed" button to mark all tasks as completed and the "Set All Uncompleted" button to mark all tasks as uncompleted.

### Performance Considerations

With the current state of the `setAllCompleted` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

In the next lesson, we'll refactor this code to address these performance challenges by moving the logic to the server.

