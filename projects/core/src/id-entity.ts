
import { Field, EntityBase, UuidField } from './remult3';
export class IdEntity extends EntityBase {
  @UuidField()
  id: string;

}
