import { Fields } from './Fields'
import { EntityBase } from './RepositoryImplementation'

export class IdEntity extends EntityBase {
  @Fields.uuid()
  id: string
}
