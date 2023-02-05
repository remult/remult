# Appendix 2 - Using Authorization metadata on the front end

In the [Authorization](./auth.md) section we've defined that only users with "admin" role can insert and delete tasks - but currently the frontend still displays these options also for users that are not authorized.

Let's adjust the code to hide these buttons based on the Task's `metadata`.

## Setup - include user info in the session data

To check if the user is allowed to perform these tasks, we'll need to instruct next-auth to include the user info as part of the session data.

Apply these changes to the code of `[...nextauth].ts` file

_pages/api/auth/[...nextauth].ts_

```ts{2-7}
export default NextAuth({
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: validUsers.find(user => user.id === token?.sub)
    })
  }
  //...
})
```

- This code instructs next to search for the user in the `validUsers` array and return it's info as part of the `session` info.

Next let's set remult's user based on the `session` info

```ts{4}
useEffect(() => {
  if (session.status === "unauthenticated") signIn()
  else fetchTasks().then(setTasks)
  remult.user = session.data?.user as UserInfo
}, [session])
```

## Show components based on the entity's metadata
Now let's use the entity's metadata to only show the form if the user is allowed to insert

```tsx{2,11}
<main>
  {taskRepo.metadata.apiInsertAllowed && (
    <form onSubmit={addTask}>
      <input
        value={newTaskTitle}
        placeholder="What needs to be done?"
        onChange={e => setNewTaskTitle(e.target.value)}
      />
      <button>Add</button>
    </form>
  )}
  ...
</main>
```

And let's do the same for the `delete` button:

```tsx{10,12}
return (
  <div key={task.id}>
    <input
      type="checkbox"
      checked={task.completed}
      onChange={e => setCompleted(e.target.checked)}
    />
    <input value={task.title} onChange={e => setTitle(e.target.value)} />
    <button onClick={saveTask}>Save</button>
    {taskRepo.metadata.apiDeleteAllowed && (
      <button onClick={deleteTask}>Delete</button>
    )}
  </div>
)
```

This method has the advantage of being able to reuse the `allowApiDelete` definition in the entity and get a consistent authorization behavior across our api and frontend
