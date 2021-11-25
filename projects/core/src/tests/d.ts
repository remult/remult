import { BackendMethod } from '../server-action';
import { Field, Entity, EntityBase } from '../remult3';
import { dWithPrefilter } from './dWithPrefilter';




@Entity('d1', {
    allowApiCrud: true
})
export class d extends EntityBase {
    @Field()
    id: number;
    @Field()
    b: number;

    static count = 0;
    @BackendMethod({ allowed: true })
    async doIt() {
        dWithPrefilter.count++;
        return true;
    }
}
