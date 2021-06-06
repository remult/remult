import { v4 as uuid } from 'uuid';
import { Field, EntityBase } from './remult3';
export class IdEntity extends EntityBase {
  @Field({
    allowApiUpdate: false,
    defaultValue: () => uuid()
  })
  id: string;

}
