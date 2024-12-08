import { Entity, Fields } from 'remult'
import { Task } from './Task.js'

@Entity<TaskExtra>('TaskExtraKey', {
  dbName: 'tasks',
})
export class TaskExtra extends Task {
  @Fields.string()
  description = ''
}
