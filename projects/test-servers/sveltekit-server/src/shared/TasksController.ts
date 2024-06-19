import { BackendMethod, remult } from 'remult'
import { Task } from './Task'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {
    remult.context.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    remult.context.setHeaders({ 'header-from-remult-controller': str })

    return { str }
  }
}
