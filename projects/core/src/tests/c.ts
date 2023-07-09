import { Remult } from '../context'
import { Entity, EntityBase, Field, Fields } from '../remult3'

@Entity('c', { allowApiCrud: true })
export class c extends EntityBase {
  @Fields.integer()
  id: number
  @Fields.string()
  name: string
  constructor(private remult: Remult) {
    super()
  }
}
