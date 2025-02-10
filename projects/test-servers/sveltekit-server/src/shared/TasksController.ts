import { BackendMethod, remult } from 'remult'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {
    // TODO: How to switch from remult.context.setCookie to remult.res.setCookie ?
    remult.context.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    remult.context.setHeaders({ 'header-from-remult-controller': str })

    return { str }
  }
}
