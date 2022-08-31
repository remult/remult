
import { Field, EntityBase, Fields } from './remult3/index.js';
export class IdEntity extends EntityBase {
  @Fields.uuid()
  id: string;

}
