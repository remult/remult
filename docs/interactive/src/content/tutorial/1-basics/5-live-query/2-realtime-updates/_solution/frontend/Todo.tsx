import { useEffect, useState, type FormEvent } from 'react'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

const taskRepo = repo(Task)

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  async function addTask(e: FormEvent) {
    e.preventDefault()
    try {
      await taskRepo.insert({ title: newTaskTitle })
      setNewTaskTitle('')
    } catch (error: any) {
      alert((error as { message: string }).message)
    }
  }

  async function setCompleted(task: Task, completed: boolean) {
    await taskRepo.update(task, { completed })
  }

  async function deleteTask(task: Task) {
    try {
      await taskRepo.delete(task)
    } catch (error: any) {
      alert((error as { message: string }).message)
    }
  }

  useEffect(() => {
    return taskRepo.liveQuery().subscribe((info) => setTasks(info.applyChanges))
  }, [])

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
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => setCompleted(task, e.target.checked)}
              />
              {task.title}
              <button
                onClick={() => deleteTask(task)}
                style={{ marginLeft: 'auto' }}
              >
                Delete
              </button>
            </div>
          )
        })}
      </main>
    </div>
  )
}
