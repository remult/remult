# CRUD Operations
Let's make the `tasks` updatable, we'll start by adding a `handleChange` method and use an input for the `title` and `completed` fields.
*src/App.tsx*
```tsx{1-3,13-18}
const handleChange = (task: Task, values: Partial<Task>) => {
   setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
}
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
           onChange={e => handleChange(task, { completed: e.target.checked })}/>
           <input
           value={task.title}
           onChange={e => handleChange(task, { title: e.target.value })} />
        </div>
     ))}
   </div>
);
```

Now, let's add a `save` button that'll save the `entity` to the server.
*src/App.tsx*
```tsx{1-4,20}
const saveTask = async (task: Task) => {
   const savedTask = await taskRepo.save(task);
   setTasks(tasks.map(t => t === task ? savedTask : t));
}
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
           <button onClick={() => saveTask(task)}>Save</button>
        </div>
     ))}
   </div>
);
```
### Add new Tasks
*src/App.tsx*
```tsx{1-3,22}
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
     {tasks.map(task => (
        <div key={task.id}>
           <input type="checkbox"
           checked={task.completed}
           onChange={e => handleChange(task, { completed: e.target.checked })} />
           <input
           value={task.title}
           onChange={e => handleChange(task, { title: e.target.value })} />
           <button onClick={() => saveTask(task)}>Save</button>
        </div>
     ))}
     <button onClick={addTask}>Add Task</button>
   </div>
);
```

* Note that the task is not saved to the server until you press the `Save` button. The `taskRepo.Save` method knows that this is a new row, because it has no `id`. Alternatively you can adjust it to use the `taskRepo.insert` method.

### Delete a task
*src/App.tsx*
```tsx{1-4,21}
const deleteTask = async (task: Task) => {
  await taskRepo.delete(task);
  setTasks(tasks.filter(t => t !== task));
}
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
        <button onClick={() => saveTask(task)}>Save</button>
        <button onClick={() => deleteTask(task)}>Delete</button>
      </div>
    ))}
    <button onClick={addTask}>Add Task</button>
  </div>
);
```

### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

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
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hideCompleted, setHideCompleted] = useState(false);
  useEffect(() => {
    taskRepo.find({
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
    }).then(setTasks);
  }, [hideCompleted]);
  const handleChange = (task: Task, values: Partial<Task>) => {
    setTasks(tasks.map(t => t === task ? { ...task, ...values } : t));
  }
  const saveTask = async (task: Task) => {
    const savedTask = await taskRepo.save(task);
    setTasks(tasks.map(t => t === task ? savedTask : t));
  }
  const addTask = () => {
    setTasks([...tasks, new Task()])
  }
  const deleteTask = async (task: Task) => {
    await taskRepo.delete(task);
    setTasks(tasks.filter(t => t !== task));
  }
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
          <button onClick={() => saveTask(task)}>Save</button>
          <button onClick={() => deleteTask(task)}>Delete</button>
        </div>
      ))}
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}

export default App;
```
