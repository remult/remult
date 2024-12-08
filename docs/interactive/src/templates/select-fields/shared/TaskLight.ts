import { Entity, Fields } from 'remult'

@Entity<TaskLight>('TaskLight', {
  sqlExpression: 'tasks',
})
export class TaskLight {
  @Fields.uuid()
  id = ''

  @Fields.string()
  title = ''
}
