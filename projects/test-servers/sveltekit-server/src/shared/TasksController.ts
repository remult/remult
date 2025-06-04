import { BackendMethod, remult } from 'remult'

export class TasksController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {
    // Using the new framework-agnostic remult.res.setCookie
    remult.res.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    
    // Using the new framework-agnostic remult.res.setHeaders
    remult.res.setHeaders({
      'X-Custom-Header': 'Hello from Remult!',
      'X-Request-ID': crypto.randomUUID()
    })

    return { str, message: 'Headers and cookie set successfully!' }
  }
}
