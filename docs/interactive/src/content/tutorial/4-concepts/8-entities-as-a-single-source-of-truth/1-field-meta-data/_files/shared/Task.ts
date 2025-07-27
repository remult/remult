import { Entity, Fields } from 'remult'
import { TaskPriorities, type TaskPriority } from './TaskPriority'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string({
    caption: 'The Task Title',
  })
  title = ''

  @Fields.literal<Task>(() => TaskPriorities, {
    caption: 'Priority Level',
    displayValue: (task) =>
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1), // Capitalizes the first letter for display
  })
  priority: TaskPriority = 'low'

  @Fields.boolean<Task>()
  completed = false

  @Fields.createdAt({
    caption: 'Task Creation Date',
    displayValue: (_, value) => value?.toLocaleDateString(),
  })
  createdAt?: Date
}
