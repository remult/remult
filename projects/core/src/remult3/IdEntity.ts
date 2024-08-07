import { Fields } from './Fields.js'
import { EntityBase } from './RepositoryImplementation.js'

export class IdEntity extends EntityBase {
  @Fields.uuid()
  id!: string
}
