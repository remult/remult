---
type: lesson
title: Role-based Authorization on the Frontend
template: auth-3
focus: /frontend/Todo.tsx
---

## Role-based Authorization on the Frontend

From a user experience perspective, it only makes sense that users who can't add or delete tasks shouldn't see the buttons for those actions. Let's reuse the same authorization definitions on the frontend.

We'll use the entity's metadata to only show the form if the user is allowed to insert tasks.

### Step 1: Hide the Add Task Form

```tsx title="frontend/Todo.tsx" add={5,14}
  return (
    <div>
      <h1>Todos</h1>
      <main>
        {taskRepo.metadata.apiInsertAllowed() && (
          <form onSubmit={addTask}>
            <input
              value={newTaskTitle}
              placeholder="What needs to be done?"
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button>Add</button>
          </form>
        )}
        {error && (
          <div>
            <strong style={{ color: 'red' }}>Error: {error.message}</strong>
          </div>
        )}
```

### Code Explanation

- We use `taskRepo.metadata.apiInsertAllowed()` to check if the current user is allowed to insert tasks. If the user has the required permissions, the form to add a new task is displayed; otherwise, it's hidden.

### Step 2: Hide the Delete Button

Let's apply the same logic to the `delete` button:

```tsx title="frontend/Todo.tsx" add={11,18}
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
        {taskRepo.metadata.apiDeleteAllowed(task) && (
          <button
            onClick={() => deleteTask(task)}
            style={{ marginLeft: 'auto' }}
          >
            Delete
          </button>
        )}
      </div>
    )
  })
}
```

### Code Explanation

- We use `taskRepo.metadata.apiDeleteAllowed(task)` to check if the current user is allowed to delete the specific task. The delete button is only displayed if the user has the necessary permissions.
- We pass the `task` object to the `apiDeleteAllowed` method because this authorization check can be more sophisticated and might depend on the specific values of the task.

### Keeping the Frontend Consistent

By using these methods, we ensure that the frontend stays consistent with the API's authorization rules. Users only see the actions they are allowed to perform, creating a seamless and secure user experience.

### Try It Out

Test the app by signing in as different users (e.g., as an admin and a regular user) and verify that the add and delete buttons appear or disappear based on the user's role.
