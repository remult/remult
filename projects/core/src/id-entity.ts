import { v4 as uuid } from 'uuid';
import { Column, EntityBase } from './remult3';
export class IdEntity extends EntityBase {
  @Column({
    allowApiUpdate: false,
    defaultValue: () => uuid()
  })
  id: string;

}
