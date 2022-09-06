# Paging, Sorting and Filtering
The RESTful API created by Remult supports **server-side paging, sorting, and filtering**. Let's use that to limit, sort and filter the list of tasks.

## Limit Number of Fetched Tasks
Since our database may eventually contain a lot of tasks, it make sense to use a **paging strategy** to limit the number of tasks retrieved in a single fetch from the back-end database.

Let's limit the number of fetched tasks to `20`.

In the `fetchTasks` function, pass an `options` argument to the `find` method call and set its `limit` property to 20.

*pages/index.tsx*
```ts{3}
async function fetchTasks() {
  return remult.repo(Task).find({
    limit: 20
  });
}
```

There aren't enough tasks in the database for this change to have an immediate effect, but it will have one later on when we'll add more tasks.

::: tip
To query subsequent pages, use the [Repository.find()](../../docs/ref_repository.md#find) method's `page` option.
:::

## Show Active Tasks on Top
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `fetchTasks` function, set the `orderBy` property of the `find` method call's `option` argument to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

*pages/index.tsx*
```ts{4}
async function fetchTasks() {
  return remult.repo(Task).find({
    limit: 20,
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

*pages/index.tsx*
```ts{1,5}
async function fetchTasks(hideCompleted: boolean) {
   return remult.repo(Task).find({
      limit: 20,
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

2. Add a `hideCompleted` boolean React state to the `Home` function component.

*pages/index.tsx*
```ts
const [hideCompleted, setHideCompleted] = useState(false);
```

3. In the `useEffect` hook of the `Home` function component, modify the call to `fetchTasks` and register the `hideCompleted` state in the second argument of `useEffect` (this will cause the effect to re-run when `hideCompleted` changes).

*pages/index.tsx*
```ts{2-3}
useEffect(() => {
   fetchTasks(hideCompleted).then(setTasks);
}, [hideCompleted]);
```

4. Add a `checkbox` input element immediately before the `tasks` map in `home/index.tsx`, bind its check state to the `hideCompleted` state, and add an `onChange` handler which calls `setHideCompleted` when the value of the checkbox is changed.

*pages/index.tsx*
```tsx{4-8}
return (
   <div>
      <main>
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
      </main>
   </div>
);
```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
