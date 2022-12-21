import { BackendMethod, Entity, Fields, Remult, Validators } from "remult";

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
    @BackendMethod({ allowed: true ,paramTypes:[Remult]})
    static async testInjectedRemult(remult?:Remult) {
        return await remult!.repo(Task).count()
    }
}