import { Entity, Fields, Relations } from 'remult'
import { sqlRelationsFilter } from 'remult/internals'
import { Task } from './Task'

@Entity<TimeEntry>('timeEntries', {
  allowApiCrud: true,
  apiPrefilter: () =>
    sqlRelationsFilter(TimeEntry).task.some(Task.allowedTasks()),
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
