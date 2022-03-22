import { Remult } from '../context';
import { Entity, EntityBase, Field, IntegerField, StringField } from '../remult3';


@Entity('c', { allowApiCrud: true })
export class c extends EntityBase {
    @IntegerField()
    id: number;
    @StringField()
    name: string;
    constructor(private remult: Remult) {
        super();
    }
}
