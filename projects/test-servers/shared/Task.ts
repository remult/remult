import { Entity, Fields } from '../../core/src/remult3';
import { Validators } from '../../core/src/validators';
import { BackendMethod } from '../../core/src/server-action';
import { remult } from '../../core/src/remult-proxy';
import { isBackend, Remult } from '../../core/src/context';





@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string({
        validate: (r, c) => {

            if (isBackend())
                Validators.required(r, c)
        }
    })
    title = '';

    @Fields.boolean()
    completed = false;
    @BackendMethod({ allowed: false })
    static testForbidden() {
    }
    @BackendMethod({ allowed: true })
    static async testStaticRemult() {
        return await remult.repo(Task).count()
    }
    @BackendMethod({ allowed: true })
    static async testInjectedRemult(remult?:Remult) {
        return await remult!.repo(Task).count()
    }
}
