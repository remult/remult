import type { ClassType } from '../classType.js'
import type { RemultServerOptions, Routes } from './remult-api-server.js'

export class Module<RequestType> {
  key: string
  priority?: number
  entities?: ClassType<unknown>[]
  controllers?: ClassType<unknown>[]
  initApi?: RemultServerOptions<RequestType>['initApi']
  initRequest?: RemultServerOptions<RequestType>['initRequest']
  routes?: Routes
  modules?: Module<RequestType>[]

  constructor(options: ModuleInput<RequestType>) {
    this.key = options.key
    this.priority = options.priority
    this.entities = options.entities
    this.controllers = options.controllers
    this.initRequest = options.initRequest
    this.initApi = options.initApi
    this.routes = options.routes
    this.modules = options.modules
  }
}

export interface ModuleInput<RequestType> {
  key: string
  /** @default 0 */
  priority?: number
  entities?: ClassType<unknown>[]
  controllers?: ClassType<unknown>[]
  initApi?: RemultServerOptions<RequestType>['initApi']
  initRequest?: RemultServerOptions<RequestType>['initRequest']
  routes?: Routes
  modules?: Module<RequestType>[]
}
