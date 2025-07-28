import { Entity, Fields, Relations, repo, SqlDatabase, dbNamesOf } from 'remult'
import { Task } from './Task'

@Entity<TimeEntry>('timeEntries', {
  allowApiCrud: true,
  apiPrefilter: async () => {
    // Get database names for Task and TimeEntry entities
    const task = await dbNamesOf(Task)
    const timeEntry = await dbNamesOf(TimeEntry)
    return SqlDatabase.rawFilter(async ({ filterToRaw }) => {
      // Convert Task.allowedTasks() to a SQL filter
      const tasksSqlFilter = await filterToRaw(Task, Task.allowedTasks())
      return `${timeEntry.taskId} 
          in (select ${task.id} 
                from ${task} 
               ${tasksSqlFilter ? `where ${tasksSqlFilter}` : ''})`
    })
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
