import { useEffect, useState, type FormEvent } from "react";
import { repo } from "remult";
import { Task } from "./Task";

export default function Todo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  async function addTask(e: FormEvent) {
    e.preventDefault();
    try {
      const newTask = await repo(Task).insert({ title: newTaskTitle });
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
    } catch (error: any) {
      alert((error as { message: string }).message);
    }
  }
  async function setCompleted(task: Task, completed: boolean) {
    await repo(Task).update(task.id, { completed });
    task.completed = completed;
    setTasks([...tasks]);
  }
  async function deleteTask(task: Task) {
    await repo(Task).delete(task.id);
    setTasks(tasks.filter((x) => x !== task));
  }
  const [page, setPage] = useState(1);
  useEffect(() => {
    repo(Task)
      .find({
        page,
        limit: 5,
      })
      .then(setTasks);
  }, [page]);
  return (
    <div>
      <strong>Todos</strong>
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
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => setCompleted(task, e.target.checked)}
              />
              {task.title}
              <button onClick={() => deleteTask(task)}>Delete</button>
            </div>
          );
        })}
      </main>
      <footer>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Prev
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </footer>
    </div>
  );
}
