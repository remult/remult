import { Entity, Fields } from 'remult'
@Entity('abc')
class Task {
  @Fields.uuid()
  id = ''
  @Fields.string()
  name = ''
}
