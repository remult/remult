
import { Field, EntityBase, Fields } from './remult3';
export class IdEntity extends EntityBase {
  @Fields.Uuid()
  id: string;

}
