import { FormEvent, useEffect, useState } from "react";
import { Task, TasksController, remult } from "shared";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const taskRepo = remult.repo(Task);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await TasksController.insertTask({ title: newTaskTitle });
      setNewTaskTitle("");
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };

  const setAllCompleted = async (completed: boolean) => {
    await TasksController.setAllCompleted(completed);
  };

  useEffect(() => {
    return taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { createdAt: "asc" },
      })
      .subscribe((info) => setTasks(info.applyChanges));
  }, []);
  return (
    <div>
      <h1>Todos</h1>
      <main>
        <div>
          <button onClick={() => setAllCompleted(true)}>
            Set All Completed
          </button>
          <button onClick={() => setAllCompleted(false)}>
            Set All Uncompleted
          </button>
        </div>
        {taskRepo.metadata.apiInsertAllowed() && (
          <form onSubmit={addTask}>
            <input
              value={newTaskTitle}
              placeholder="What needs to be done?"
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button>Add</button>
          </form>
        )}
        {tasks.map((task) => {
          const setTask = (value: Task) =>
            setTasks((tasks) => tasks.map((t) => (t === task ? value : t)));

          const setCompleted = async (completed: boolean) =>
            await TasksController.saveTask({ ...task, completed });

          const setTitle = (title: string) => setTask({ ...task, title });

          const saveTask = async () => {
            try {
              await TasksController.saveTask(task);
            } catch (error) {
              alert((error as { message: string }).message);
            }
          };

          const deleteTask = async () => {
            try {
              await TasksController.deleteTask(task);
            } catch (error) {
              alert((error as { message: string }).message);
            }
          };

          return (
            <div key={task.id}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <input
                value={task.title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={saveTask}>Save</button>
              {taskRepo.metadata.apiDeleteAllowed(task) && (
                <button onClick={deleteTask}>Delete</button>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
