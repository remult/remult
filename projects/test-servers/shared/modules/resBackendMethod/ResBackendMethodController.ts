import { BackendMethod, remult } from '../../../../core'

export class ResBackendMethodController {
  @BackendMethod({ allowed: true })
  static async addHeader(str: string) {    
    // Using the new framework-agnostic remult.res.setHeaders
    remult.res.setHeaders({
      'X-Custom-Header': 'Hello from Remult!',
      'X-Request-ID': crypto.randomUUID(),
      'header-from-remult-controller': str,
    })

    return { message: 'Headers set successfully!' }
  }

  @BackendMethod({ allowed: true })
  static async addCookie(str: string) {
    // Using the new framework-agnostic remult.res.setCookie
    remult.res.setCookie('KIT_REMULT_COOKIE', str, { path: '.' })
    
    return { str }
  }
}
