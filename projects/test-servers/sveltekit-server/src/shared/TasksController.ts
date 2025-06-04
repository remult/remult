import { BackendMethod, remult } from 'remult'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {
    // Using the new framework-agnostic remult.res.setCookie
    remult.res.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    
    // remult.context.setHeaders({ 'header-from-remult-controller': str })

    return { str }
  }
}
