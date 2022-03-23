import { BackendMethod } from '../server-action';
import { Field, Entity, EntityBase, IntegerField } from '../remult3';
import { dWithPrefilter } from './dWithPrefilter';




@Entity('d1', {
    allowApiCrud: true
})
export class d extends EntityBase {
    @IntegerField()
    id: number;
    @IntegerField()
    b: number;

    static count = 0;
    @BackendMethod({ allowed: true })
    async doIt() {
        dWithPrefilter.count++;
        return true;
    }
}
