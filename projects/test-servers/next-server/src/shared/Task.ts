import {
  BackendMethod,
  Entity,
  Fields,
  ProgressListener,
  Remult,
  Validators,
  remult,
} from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
  saving: (task) => {
    if (task.title.startsWith('empty')) task.id = ''
  },
})
export class Task {
  @Fields.id()
  id!: string

  @Fields.string((options, remult) => {
    options.validate = (r, c) => {
      if (!remult.dataProvider.isProxy) Validators.required(r, c)
    }
  })
  title = ''

  @Fields.boolean()
  completed = false
  @BackendMethod({ allowed: false })
  static testForbidden() {}
  @BackendMethod({ allowed: true })
  static async testStaticRemult() {
    return await remult.repo(Task).count()
  }
  @BackendMethod({ allowed: true, paramTypes: [Remult] })
  static async testInjectedRemult(remult?: Remult) {
    return await remult!.repo(Task).count()
  }
  @BackendMethod({ allowed: true, queue: true, paramTypes: [ProgressListener] })
  static async testQueuedJob(progress?: ProgressListener) {
    for (let i = 0; i < 3; i++) {
      await new Promise((res) => setTimeout(res, 100))
      progress?.progress(i / 3)
    }
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
