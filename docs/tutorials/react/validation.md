# Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate the title field

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Fields.string` decorator for the `title` field to include an argument which implements the `FieldOptions` interface. Implement the interface using an object literal and set the object's `validate` property to `Validators.required`.

   *src/shared/Task.ts*
   ```ts{1-3}
    @Fields.string({
        validate: Validators.required
    })
    title = '';
   ```
   ::: warning Imports
   This code requires imports for `Validators` from the existing import of `remult`.
   :::

2. In the `App.tsx` template, adjust the `saveTask` function to catch errors .

   *src/App.tsx*
   ```tsx{2,5-7}
   const saveTask = async (task: Task) => {
     try {
       const savedTask = await taskRepo.save(task);
       setTasks(tasks.map(t => t === task ? savedTask : t));
     } catch (error: any) {
       alert(error.message);
     }
   }
   ```


After the browser refreshes, try creating a new `task` or saving an existing one without title - the "Should not be empty" error message is displayed.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:3002/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:3002/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,

### Displaying the error next to the relevant Input
To create a better UX, let's display the validation error next to the relevant input.
1. Adjust the `tasks` array to also include an optional error
   ```tsx{2,8}
   import { useEffect, useState } from "react";
   import { ErrorInfo } from "remult";
   import { remult } from "./common";
   import { Task } from "./shared/Task";
   
   const taskRepo = remult.repo(Task);
   function App() {
     const [tasks, setTasks] = useState<(Task & { error?: ErrorInfo<Task> })[]>([]);
     const [hideCompleted, setHideCompleted] = useState(false);
   ```
2. Adjust the `saveTask` function to store that error
   ```tsx{6}
   const saveTask = async (task: Task) => {
     try {
       const savedTask = await taskRepo.save(task);
       setTasks(tasks.map(t => t === task ? savedTask : t));
     } catch (error: any) {
       setTasks(tasks.map(t => t === task ? { ...task, error } : t));
     }
   }   
   ```
3. Display the error next to the relevant `input` 
   ```tsx{16}
   return (
     <div >
       <input
         type="checkbox"
         checked={hideCompleted}
         onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
       <hr />
       {tasks.map(task => (
         <div key={task.id}>
           <input type="checkbox"
             checked={task.completed}
             onChange={e => handleChange(task, { completed: e.target.checked })} />
           <input
             value={task.title}
             onChange={e => handleChange(task, { title: e.target.value })} />
           {task.error?.modelState?.title}
           <button onClick={() => saveTask(task)}>Save</button>
           <button onClick={() => deleteTask(task)}>Delete</button>
         </div>
       ))}
       <button onClick={addTask}>Add Task</button>
     </div>
   );   
   ```