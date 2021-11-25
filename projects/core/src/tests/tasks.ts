import { Field, Entity, EntityBase } from '../remult3';

@Entity('tasks', { allowApiCrud: true })
export class tasks extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    completed: boolean = false;
}
