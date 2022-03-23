import { Field, Entity, EntityBase, Fields } from '../remult3';

@Entity('tasks', { allowApiCrud: true })
export class tasks extends EntityBase {
    @Fields.Integer()
    id: number;
    @Fields.String()
    name: string;
    @Fields.Boolean()
    completed: boolean = false;
}
