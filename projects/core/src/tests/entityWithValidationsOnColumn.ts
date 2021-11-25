import { Field, Entity, EntityBase } from '../remult3';
import { entityWithValidations } from '../shared-tests/entityWithValidations';

@Entity('', { allowApiCrud: true })
export class entityWithValidationsOnColumn extends EntityBase {
  @Field()
  myId: number;
  @Field<entityWithValidations, string>({
    validate: (t, c) => {
      if (!t.name || t.name.length < 3)
        c.error = 'invalid on column';
    }
  })
  name: string;

}
