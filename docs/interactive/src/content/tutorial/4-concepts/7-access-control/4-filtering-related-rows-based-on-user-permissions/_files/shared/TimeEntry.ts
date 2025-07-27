import { Entity, Fields, Relations, repo, SqlDatabase, dbNamesOf } from 'remult'
import { Task } from './Task'

@Entity<TimeEntry>('timeEntries', {
  allowApiCrud: true,
  apiPrefilter: async () => {
    // Fetch allowed tasks based on the custom filter
    // Will be improved in this lesson!
    const tasks = await repo(Task).find({ where: Task.allowedTasks() })
    return { taskId: { $in: tasks.map((t) => t.id) } }
  },
})
export class TimeEntry {
  @Fields.id()
  id = ''

  @Fields.string({ required: true })
  taskId = ''

  @Relations.toOne<TimeEntry, Task>(() => Task, 'taskId')
  task?: Task

  @Fields.date()
  startTime!: Date

  @Fields.date()
  endTime!: Date
}
