import { Remult } from '../context';
import { Entity, EntityBase, Field } from '../remult3';


@Entity('c', { allowApiCrud: true })
export class c extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    constructor(private remult: Remult) {
        super();
    }
}
