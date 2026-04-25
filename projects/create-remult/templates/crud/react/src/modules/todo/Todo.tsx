import { useEffect, useState, type FormEvent } from "react";
import Tile from "../Tile";
import { repo } from "remult";
import { Task } from "./Task";

export default function Todo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    repo(Task)
      .find({
        where: hideCompleted ? { completed: false } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      })
      .then(setTasks);
  }, [hideCompleted]);
  function toggleHideCompleted() {
    setHideCompleted(!hideCompleted);
  }

  const [newTaskTitle, setNewTaskTitle] = useState("");

  async function addTask(e: FormEvent) {
    e.preventDefault();
    try {
      const newTask = await repo(Task).insert({ title: newTaskTitle });
      setTasks([newTask, ...tasks]);
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

  return (
    <Tile
      title="Todos"
      subtitle="Fully functional todo app"
      icon=""
      width="full"
      className="todo"
    >
      <main>
        <form onSubmit={addTask}>
          <input
            type="text"
            value={newTaskTitle}
            placeholder="What needs to be done?"
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <button>
            <img src="plus.svg" alt="Add" />
          </button>
        </form>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              className={`todo__task ${task.completed ? "completed" : ""}`}
              key={task.id}
              onClick={() => setCompleted(task, !task.completed)}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  setCompleted(task, e.target.checked);
                }}
              />
              <span>{task.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task);
                }}
              >
                <img src="trash.svg" alt="Delete" />
              </button>
            </div>
          ))
        ) : (
          <p className="todo__empty">
            There is nothing to do right now, try adding some todos.
          </p>
        )}
        <div className="button-row">
          <button onClick={toggleHideCompleted}>
            {hideCompleted ? "Show" : "Hide"} completed
          </button>{" "}
        </div>
      </main>
    </Tile>
  );
}
