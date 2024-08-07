import { useEffect, useState } from 'react'
import { Task } from '../shared/Task'
import { repo } from 'remult'

const taskRepo = repo(Task)

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([])
  useEffect(() => {
    taskRepo
      .find({
        limit: 2,
        page: 2,
      })
      .then(setTasks)
  }, [])
  return (
    <div>
      <h1>Todos</h1>
      <main>
        {tasks.map((task) => {
          return (
            <div key={task.id}>
              <input type="checkbox" checked={task.completed} />
              {task.title}
            </div>
          )
        })}
      </main>
    </div>
  )
}
