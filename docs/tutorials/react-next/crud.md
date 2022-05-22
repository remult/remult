# CRUD Operations

## Rename Tasks and Mark as Completed

To make the tasks in the list updatable, we'll bind the `tasks` React state to `input` elements and add a *Save* button to save the changes to the backend database.

1. Modify the contents of the `tasks.map` iteration within the `Home` component to include the following `handleChange` function and `input` elements.

*pages/index.tsx*
```tsx{16-31}
const Home: NextPage = () => {
   const [tasks, setTasks] = useState<Task[]>([]);
   const [hideCompleted, setHideCompleted] = useState(false);

   useEffect(() => {
      fetchTasks(hideCompleted).then(setTasks);
   }, [hideCompleted]);

   return (
      <div>
         <input
            type="checkbox"
            checked={hideCompleted}
            onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
         <hr />
         {tasks.map(task => {
            const handleChange = (values: Partial<Task>) => {
               setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
            };

            return (
               <div key={task.id}>
                  <input type="checkbox"
                     checked={task.completed}
                     onChange={e => handleChange({ completed: e.target.checked })} />
                  <input
                     value={task.title}
                     onChange={e => handleChange({ title: e.target.value })} />
               </div>
            );
         })}
      </div>
   );
}
```

   The `handleChange` function simply replaces the `tasks` state with a new array containing all unchanged tasks and a new version of the current task that includes the modified `values`.

   After the browser refreshes, the tasks can be renamed and marked as completed.

2. Add a `saveTask` function to save the state of a task to the backend database, and a *Save* button to call it.

*pages/index.tsx*
```tsx{6-8,18}
{tasks.map(task => {
   const handleChange = (values: Partial<Task>) => {
      setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
   };

   const saveTask = () => {
      taskRepo.save(task);
   };

   return (
      <div key={task.id}>
         <input type="checkbox"
            checked={task.completed}
            onChange={e => handleChange({ completed: e.target.checked })} />
         <input
            value={task.title}
            onChange={e => handleChange({ title: e.target.value })} />
         <button onClick={saveTask}>Save</button>
      </div>
   );
})}
```

Make some changes and refresh the browser to verify the backend database is updated.
## Add New Tasks

Add the highlighted `addTask` function and *Add Task* `button` to the `Home` component:

*pages/index.tsx*
```tsx{9-11,41}
const Home: NextPage = () => {
   const [tasks, setTasks] = useState<Task[]>([]);
   const [hideCompleted, setHideCompleted] = useState(false);

   useEffect(() => {
      fetchTasks(hideCompleted).then(setTasks);
   }, [hideCompleted]);

   const addTask = () => {
      setTasks([...tasks, new Task()])
   };

   return (
      <div>
         <input
            type="checkbox"
            checked={hideCompleted}
            onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
         <hr />
         {tasks.map(task => {
            const handleChange = (values: Partial<Task>) => {
               setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
            }

            const saveTask = () => {
               taskRepo.save(task);
            }

            return (
               <div key={task.id}>
                  <input type="checkbox"
                     checked={task.completed}
                     onChange={e => handleChange({ completed: e.target.checked })} />
                  <input
                     value={task.title}
                     onChange={e => handleChange({ title: e.target.value })} />
                  <button onClick={saveTask}>Save</button>
               </div>
            );
         })}
         <button onClick={addTask}>Add Task</button>
      </div>
   );
}
```

Add a few tasks and refresh the browser to verify the backend database is updated.

::: warning Note 
New tasks **will not be saved to the backend** until you press the *Save* button.
:::

::: danger Wait, there's a bug in this code
Notice that if you add a new task by clicking the *Add Task* button, click the *Save* button **multiple times**, and then refresh the browser, **multiple tasks will be added to the list instead of only one**.

This is happening because the Remult `Repository.save` method issues either a `PUT` or a `POST` request, depending on the existence of an `id` value in the `Task` object. 

To fix the bug, modify the `saveTask` function and replace the saved task in the `tasks` array with the object returned from `Repository.save` (which contains the `id` of the task created in the backend).

*pages/index.tsx*
```tsx
const saveTask = async () => {
   const savedTask = await taskRepo.save(task);
   setTasks(tasks.map(t => t === task ? savedTask : t));
};
```
:::

## Delete Tasks

Let's add a *Delete* button next to the *Save* button of each task in the list.

Add the highlighted `deleteTask` function and *Delete* `button` Within the `tasks.map` iteration in the `return` section of the `Home` component.

*pages/index.tsx*
```tsx{11-14,25}
{tasks.map(task => {
   const handleChange = (values: Partial<Task>) => {
      setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
   };

   const saveTask = async () => {
      const savedTask = await taskRepo.save(task);
      setTasks(tasks.map(t => t === task ? savedTask : t));
   };

   const deleteTask = async () => {
      await taskRepo.delete(task);
      setTasks(tasks.filter(t => t !== task));
   };

   return (
      <div key={task.id}>
         <input type="checkbox"
            checked={task.completed}
            onChange={e => handleChange({ completed: e.target.checked })} />
         <input
            value={task.title}
            onChange={e => handleChange({ title: e.target.value })} />
         <button onClick={saveTask}>Save</button>
         <button onClick={deleteTask}>Delete</button>
      </div>
   );
})}
```