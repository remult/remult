# Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

## Show Active Tasks on Top
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `fetchTasks` function, add an object literal argument to the `find` method call and set its `orderBy` with an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

*src/App.tsx*
```ts{3}
async function fetchTasks() {
  return taskRepo.find({
    orderBy: { completed: "asc" }
  });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
## Toggle Display of Completed Tasks
Let's allow the user to toggle the display of completed tasks, using server-side filtering.

1. Add a `hideCompleted` argument to the `fetchTasks` function and Modify the `fetchTasks` function, and set the `where` property of the options argument of `find`:

*src/App.tsx*
```ts{4}
async function fetchTasks(hideCompleted: boolean) {
   return taskRepo.find({
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
   });
}
```

::: warning Note
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Settings the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::

2. Add a `hideCompleted` boolean React state to the `App` function component.

*src/App.tsx*
```ts
const [hideCompleted, setHideCompleted] = useState(false);
```

3. In the `useEffect` hook of the `App` function component, modify the call to `fetchTasks` and register the `hideCompleted` state in second argument of `useEffect` (this will cause the effect to re-run when `hideCompleted` changes).

*src/App.tsx*
```ts{2-3}
useEffect(() => {
   fetchTasks(hideCompleted).then(setTasks);
}, [hideCompleted]);
```

4. Add a `checkbox` input element immediately before the `tasks` map in `App.tsx`, bind its check state to the `hideCompleted` state, and add an `onChange` handler which calls `setHideCompleted` when the value of the checkbox is changed.

*src/App.tsx*
```tsx{3-7}
return (
   <div>
   <input
      type="checkbox"
      checked={hideCompleted}
      onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
   <hr />
   {tasks.map(task => (
      <div key={task.id}>
         <input type="checkbox" checked={task.completed} />
         {task.title}
      </div>
   ))}
   </div>
);
```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
