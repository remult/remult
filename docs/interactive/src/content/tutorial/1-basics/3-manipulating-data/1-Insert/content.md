---
type: lesson
title: Insert
focus: /frontend/Todo.tsx
---

# Inserting Data

First, let's add the React code for adding a new task.

```ts add={3-6}
export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  async function addTask(e: FormEvent) {
    e.preventDefault();
  }
  useEffect(() => {
    taskRepo.find().then(setTasks);
  }, []);
```

### Code Explanation

- We added a state variable `newTaskTitle` to store the title of the new task being added.
- We defined the `addTask` function, which will handle the form submission. For now, it just prevents the default form submission behavior with `e.preventDefault()`.

Next, let's add the JSX for the form to input new tasks.

```ts add={5-12}
return (
  <div>
    <h1>Todos</h1>
    <main>
      <form onSubmit={addTask}>
        <input
          value={newTaskTitle}
          placeholder="What needs to be done?"
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button>Add</button>
      </form>
      {tasks.map((task) => {
        return (
          <div key={task.id}>
            <input type="checkbox" checked={task.completed} />
            {task.title}
          </div>
        );
      })}
    </main>
  </div>
);
```

### Code Explanation

- We added a form element with an `onSubmit` handler that calls the `addTask` function when the form is submitted.
- Inside the form, we added an input element bound to the `newTaskTitle` state variable. The `onChange` handler updates the `newTaskTitle` state as the user types.
- We added a button to submit the form.

Now let's call Remult to insert the new task.

```ts add={3-9}
async function addTask(e: FormEvent) {
  e.preventDefault()
  try {
    const newTask = await taskRepo.insert({ title: newTaskTitle })
    setTasks([...tasks, newTask])
    setNewTaskTitle('')
  } catch (error: any) {
    alert((error as { message: string }).message)
  }
}
```

### Code Explanation

- We used the `taskRepo.insert` method to insert a new task with the title stored in `newTaskTitle`. This makes a REST API `POST` call to the backend to insert the new task into the database.
- If the task is successfully inserted, we update the `tasks` state with the new task and clear the `newTaskTitle` input field.
- If there's an error, we display an alert with the error message.

This code results in the following REST API request to insert the new task:
`POST /api/tasks`

Try adding new tasks using the form in the preview window below.
