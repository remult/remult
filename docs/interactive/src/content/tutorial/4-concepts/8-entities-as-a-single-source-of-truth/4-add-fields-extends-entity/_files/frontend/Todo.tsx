import { useEffect, useState } from 'react'
import { Task } from '../shared/Task.js'
import { TaskExtra } from '../shared/TaskExtra.js'
import { repo } from 'remult'
import React from 'react'

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [extraTasks, setExtraTasks] = useState<TaskExtra[]>([])

  useEffect(() => {
    repo(Task)
      .find({ limit: 2 })
      .then((t) => setTasks(t))
    repo(TaskExtra)
      .find({ limit: 2 })
      .then((t) => setExtraTasks(t))
  }, [])

  return (
    <div>
      <h1>Todos</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2>Base</h2>
          <div>
            {tasks.map((task) => (
              <pre key={task.id}>{JSON.stringify(task, null, 2)}</pre>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Extra</h2>
          <div>
            {extraTasks.map((task) => (
              <pre key={task.id}>{JSON.stringify(task, null, 2)}</pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
