import { EntityBase, Fields } from './remult3/RepositoryImplementation';
export class IdEntity extends EntityBase {
  @Fields.uuid()
  id: string;
}
