import { Entity, Fields } from 'remult'

@Entity<TaskLight>('TaskLight', {
  sqlExpression: 'tasks',
})
export class TaskLight {
  @Fields.id()
  id = ''

  @Fields.string()
  title = ''
}
