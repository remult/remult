import { Remult } from '../context';
import { Entity, EntityBase, Field, Fields } from '../remult3';


@Entity('c', { allowApiCrud: true })
export class c extends EntityBase {
    @Fields.Integer()
    id: number;
    @Fields.String()
    name: string;
    constructor(private remult: Remult) {
        super();
    }
}
