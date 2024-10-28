import { repo } from 'remult'
import { Task } from '../shared/Task.js'

const taskRepo = repo(Task)
export function TodoItem({ task }: { task: Task }) {
  const titleField = taskRepo.fields.title
  const priorityField = taskRepo.fields.priority
  const createdAtField = taskRepo.fields.createdAt
  return (
    <div>
      <div>
        <div>
          {titleField.caption}: <strong>{task.title}</strong>
        </div>
        <div>
          {priorityField.caption}:
          <strong> {priorityField.displayValue(task)}</strong>
        </div>
        <div>
          {createdAtField.caption}:
          <strong> {createdAtField.displayValue(task)}</strong>
        </div>
      </div>
    </div>
  )
}
