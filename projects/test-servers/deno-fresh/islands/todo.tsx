/** @jsx h */
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { Task } from "../shared/task.ts";
import { Remult } from "remult";

const remult = new Remult();

const taskRepo = remult.repo(Task);

function fetchTasks(hideCompleted: boolean) {
  return taskRepo.find({
     limit: 20,
     orderBy: { completed: "asc" },
     where: { completed: hideCompleted ? false : undefined }
  });
}

export default function Todo() {
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
           onClick={e => setHideCompleted(!hideCompleted)} /> Hide Completed
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
                    onClick={e => handleChange({ completed: !task.completed })} />
                 <input
                    value={task.title}
                    onInput={e => handleChange({ title: e.currentTarget.value })} />
                 <button onClick={saveTask}>Save</button>
              </div>
           );
        })}
        <button onClick={addTask}>Add Task</button>
     </div>
  );
}