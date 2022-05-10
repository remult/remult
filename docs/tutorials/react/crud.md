# CRUD Operations

### Rename and mark tasks as completed

To make the tasks in the list updatable, we'll bind the `tasks` React state to `input` elements and add a *Save* button to save the changes to the backend database.

1. Modify the contents of the `tasks.map` iteration within the `App` component to include the following `handleChange` function and `input` elements.

   *src/App.tsx*
   ```tsx{16-31}
   function App() {
      const [tasks, setTasks] = useState<Task[]>([]);
      const [hideCompleted, setHideCompleted] = useState(false);

      useEffect(() => {
         fetchTasks(hideCompleted).then(setTasks);
      }, [hideCompleted]);

      return (
         <div >
            <input
               type="checkbox"
               checked={hideCompleted}
               onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
            <hr />
            {tasks.map(task => {
               const handleChange = (values: Partial<Task>) => {
                  setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
               }

               return (
                  <div key={task.id}>
                     <input type="checkbox"
                        checked={task.completed}
                        onChange={e => handleChange({ completed: e.target.checked })} />
                     <input
                        value={task.title}
                        onChange={e => handleChange({ title: e.target.value })} />
                  </div>
               )
            })}
         </div>
      );
   }
   ```

   The `handleChange` function simply replaces the `tasks` state with a new array containing all unchanged tasks and a new version of the current that includes the modified `values`.

   After the browser refreshes, the tasks can be renamed and marked as completed.

2. Add a `saveTask` function to save the state of a task to the backend database, and a *Save* button to call it.

   *src/App.tsx*
   ```tsx{6-8,18}
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
         <button onClick={() => saveTask()}>Save</button>
      </div>
      )
   })}
   ```

Make some changes and refresh the browser to verify the backend database is updated.
### Add new tasks

1. Add the following `addTask` function to the `App` component:

   *src/App.tsx*
   ```tsx
   const addTask = () => {
      setTasks([...tasks, new Task()])
   }
   ```

2. Add the following `button` element to the `return` section of the `App` component, immediately after the `tasks.map` iteration.

   *src/App.tsx*
   ```tsx
   <button onClick={addTask}>Add Task</button>
   ```

Add a few tasks and refresh the browser to verify the backend database is updated.
::: warning Note 
New tasks **will not be saved to the backend** until you press the *Save* button.
:::

::: danger Wait, there's a bug in this code
Notice that if you add a new task by clicking the *Add Task* button, click the *Save* button **multiple times**, and then refresh the browser, **multiple tasks will be added to the list instead of only one**.

This is happening because the Remult `Repository.save` method issues either a `PUT` or a `POST` request, depending on the existence of an `id` value in the `Task` object. 

To fix the bug, modify the `saveTask` function and replace the saved task in the `tasks` array with the object returned from `Repository.save` (which contains the `id` of the task created in the backend).

*src/App.tsx*
```tsx
const saveTask = async () => {
   const savedTask = await taskRepo.save(task);
   setTasks(tasks.map(t => t === task ? savedTask : t));
}
```
:::

### Delete tasks

Let's add a *Delete* button next to the *Save* button of each task in the list.

1. Within the `tasks.map` iteration in the `return` section of the `App` component, add the following `delete` function:

   *src/App.tsx*
   ```tsx
   const deleteTask = async () => {
      await taskRepo.delete(task);
      setTasks(tasks.filter(t => t !== task));
   }
   ```

2. Add this *Delete* `button` element immediately after the *Save* button element.

   *src/App.tsx*
   ```tsx
   <button onClick={() => deleteTask()}>Delete</button>
   ```

### Code review
We've implemented the following features of the todo app:
* Displaying the list of tasks
* Conditionally hiding completed tasks
* Updating and deleting tasks
* Creating new tasks

Here are the code files we've modified to implement these features.

*src/shared/Task.ts*
```ts
import { Entity, Fields } from "remult";

@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string()
    title = '';

    @Fields.boolean()
    completed = false;
}
```

*src/App.tsx*
```tsx
import { useEffect, useState } from "react";
import { remult } from "./common";
import { Task } from "./shared/Task";

const taskRepo = remult.repo(Task);

async function fetchTasks(hideCompleted: boolean) {
  return taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted ? false : undefined }
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    fetchTasks(hideCompleted).then(setTasks);
  }, [hideCompleted]);

  const addTask = () => {
    setTasks([...tasks, new Task()])
  }

  return (
    <div >
      <input
        type="checkbox"
        checked={hideCompleted}
        onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
      <hr />
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
            <button onClick={() => saveTask()}>Save</button>
            <button onClick={() => deleteTask()}>Delete</button>
          </div>
        )
      })}
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}

export default App;
```
