import { BackendMethod, Entity, Fields, Remult, Validators } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.id()
  id!: string

  @Fields.string({
    validate: Validators.required,
  })
  title = ''

  @Fields.boolean()
  completed = false
  @BackendMethod({ allowed: false })
  static testForbidden() {}
  @BackendMethod({ allowed: true, paramTypes: [Remult] })
  static async testInjectedRemult(remult?: Remult) {
    return await remult!.repo(Task).count()
  }
  @BackendMethod({ allowed: true })
  static testStringError() {
    throw 'test error'
  }
  @BackendMethod({ allowed: true })
  static testProperError() {
    //@ts-ignore
    throw new Error('Test Error')
  }
}
