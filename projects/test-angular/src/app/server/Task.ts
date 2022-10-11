import { Entity, Fields } from '../../../../core/src/remult3';
import { Validators } from '../../../../core/src/validators';
import { BackendMethod } from '../../../../core/src/server-action';




@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string({
        validate: Validators.required
    })
    title = '';

    @Fields.boolean()
    completed = false;
    @BackendMethod({ allowed: false })
    static testForbidden() {
    }
}
