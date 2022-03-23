import { Field, Entity, EntityBase, StringField, IntegerField } from '../remult3';
import { entityWithValidations } from '../shared-tests/entityWithValidations';

@Entity('', { allowApiCrud: true })
export class entityWithValidationsOnColumn extends EntityBase {
  @IntegerField()
  myId: number;
  @StringField<entityWithValidations>({
    validate: (t, c) => {
      if (!t.name || t.name.length < 3)
        c.error = 'invalid on column';
    }
  })
  name: string;

}
