import { Entity, Fields, SqlDatabase } from 'remult'

// SqlDatabase.LogToConsole = 'oneLiner'

@Entity<TaskLight>('TaskLight', {
  sqlExpression: 'tasks',
})
export class TaskLight {
  @Fields.uuid()
  id = ''

  @Fields.string()
  title = ''
}
