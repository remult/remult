import { Entity, Fields, SqlDatabase } from 'remult'

SqlDatabase.LogToConsole = 'oneLiner'

@Entity<TaskLight>('TaskLight', {
  dbName: 'tasks',
  allowApiRead: true,
  allowApiCrud: false,
})
export class TaskLight {
  @Fields.id()
  id = ''

  @Fields.string()
  title = ''
}
