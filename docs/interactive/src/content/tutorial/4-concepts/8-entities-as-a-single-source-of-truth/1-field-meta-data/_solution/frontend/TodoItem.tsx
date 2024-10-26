import { repo } from 'remult'
import { Task } from '../shared/Task.js'

const taskRepo = repo(Task)
export function TodoItem({ task }: { task: Task }) {
  const fields = [
    taskRepo.fields.title,
    taskRepo.fields.priority,
    taskRepo.fields.createdAt,
  ]
  return (
    <div>
      <div>
        {fields.map((field) => (
          <div key={fields.key}>
            {field.caption}: <strong>{field.displayValue(task)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
