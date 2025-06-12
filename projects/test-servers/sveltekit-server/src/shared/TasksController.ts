import { BackendMethod } from 'remult'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {
    // remult.context.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    // remult.context.setHeaders({ 'header-from-remult-controller': str })

    return { str }
  }
}
