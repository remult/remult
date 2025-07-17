import type { ClassType } from '../classType.js'
import type { RemultServerOptions } from './remult-api-server.js'

export interface ModuleInput<RequestType> {
  key: string
  /** @default 0 */
  priority?: number
  entities?: ClassType<unknown>[]
  controllers?: ClassType<unknown>[]
  initApi?: RemultServerOptions<RequestType>['initApi']
  initRequest?: RemultServerOptions<RequestType>['initRequest']
  routes?: RemultServerOptions<RequestType>['routes']
  modules?: Module<RequestType>[]
}

export class Module<RequestType> {
  key: string
  priority: number
  entities?: ClassType<unknown>[]
  controllers?: ClassType<unknown>[]
  initApi?: RemultServerOptions<RequestType>['initApi']
  initRequest?: RemultServerOptions<RequestType>['initRequest']
  routes?: RemultServerOptions<RequestType>['routes']
  modules?: Module<RequestType>[]

  constructor(options: ModuleInput<RequestType>) {
    this.key = options.key
    this.priority = options.priority ?? 0
    this.entities = options.entities
    this.controllers = options.controllers
    this.initApi = options.initApi
    this.initRequest = options.initRequest
    this.routes = options.routes
    this.modules = options.modules
  }
}

/**
 * Full flat and ordered list by index and concatenaining the modules name
 */
export const modulesFlatAndOrdered = <RequestType>(
  modules: Module<RequestType>[],
): Module<RequestType>[] => {
  const flattenModules = (
    modules: Module<RequestType>[],
    parentName = '',
  ): Module<RequestType>[] => {
    return modules.reduce<Module<RequestType>[]>((acc, module) => {
      const fullKey = parentName ? `${parentName}-${module.key}` : module.key
      // Create a new module object without the 'modules' property
      const { modules: _, ...flatModule } = module
      const newModule = { ...flatModule, key: fullKey }
      const subModules = module.modules
        ? flattenModules(module.modules, fullKey)
        : []
      return [...acc, newModule, ...subModules]
    }, [])
  }

  const flatModules = flattenModules(modules)
  flatModules.sort((a, b) => a.priority - b.priority)
  return flatModules
}
