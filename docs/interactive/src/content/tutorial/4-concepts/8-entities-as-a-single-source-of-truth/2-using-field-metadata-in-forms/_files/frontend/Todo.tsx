import { repo } from 'remult'
import { Task } from '../shared/Task.js'
import { TodoItem } from './TodoItem'
import { useEffect, useState } from 'react'

const taskRepo = repo(Task)

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>()
  useEffect(
    () =>
      taskRepo
        .liveQuery()
        .subscribe(({ applyChanges }) => setTasks(applyChanges)),
    [],
  )

  return (
    <div>
      <h1>Todos</h1>
      <main>
        {tasks?.map((task) => <TodoItem task={task} key={task.id} />)}
      </main>
    </div>
  )
}
