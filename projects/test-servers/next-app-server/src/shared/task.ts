import { BackendMethod, Entity, Fields, Remult, Validators, isBackend, remult } from "remult";

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
    @BackendMethod({ allowed: true, paramTypes: [Remult] })
    static async testInjectedRemult(remult?: Remult) {
        return await remult!.repo(Task).count()
    }
}