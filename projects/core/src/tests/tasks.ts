import { Field, Entity, EntityBase, IntegerField, StringField, BooleanField } from '../remult3';

@Entity('tasks', { allowApiCrud: true })
export class tasks extends EntityBase {
    @IntegerField()
    id: number;
    @StringField()
    name: string;
    @BooleanField()
    completed: boolean = false;
}
