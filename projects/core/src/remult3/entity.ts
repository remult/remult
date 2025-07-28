import type { Remult } from '../context.js'
import { setControllerSettings } from '../context.js'
import type { EntityOptions } from '../entity.js'
import type { customFilterInfo } from '../filter/filter-interfaces.js'
import {
  entityInfo,
  entityInfo_key,
  getEntitySettings,
} from './getEntityRef.js'
import type { EntityOptionsFactory } from './RepositoryImplementation.js'
import type { ClassDecoratorContextStub } from './remult3.js'
import { remultStatic } from '../remult-static.js'

/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import  { Entity, Fields } from "remult";
 * @Entity("tasks", {
 *    allowApiCrud: true
 * })
 * export class Task {
 *    @Fields.id()
 *    id!: string;
 *    @Fields.string()
 *    title = '';
 *    @Fields.boolean()
 *    completed = false;
 * }
 * @note
 * EntityOptions can be set in two ways:
 * @example
 * // as an object
 * @Entity("tasks",{ allowApiCrud:true })
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Entity("tasks", (options,remult) => options.allowApiCrud = true)
 */
export function Entity<entityType>(
  key: string,
  ...options: (
    | EntityOptions<
        entityType extends new (...args: any) => any
          ? InstanceType<entityType>
          : entityType
      >
    | ((
        options: EntityOptions<
          entityType extends new (...args: any) => any
            ? InstanceType<entityType>
            : entityType
        >,
        remult: Remult,
      ) => void)
  )[]
) {
  return (
    target: any,
    info?: ClassDecoratorContextStub<
      entityType extends new (...args: any) => any ? entityType : never
    >,
  ) => {
    let theClass = target
    while (theClass != null) {
      for (const rawFilterMember in theClass) {
        if (Object.prototype.hasOwnProperty.call(theClass, rawFilterMember)) {
          const element = target[rawFilterMember] as customFilterInfo<any>
          if (element?.rawFilterInfo) {
            if (!element.rawFilterInfo.key)
              element.rawFilterInfo.key = rawFilterMember
          }
        }
      }
      theClass = Object.getPrototypeOf(theClass)
    }
    let factory: EntityOptionsFactory = (remult) => {
      let r = {} as EntityOptions<
        entityType extends new (...args: any) => any
          ? InstanceType<entityType>
          : entityType
      >
      for (const o of options) {
        if (o) {
          if (typeof o === 'function') o(r, remult)
          else Object.assign(r, o)
        }
      }

      let base = Object.getPrototypeOf(target)
      if (base) {
        let baseFactory = getEntitySettings(base, false)
        if (baseFactory) {
          let opt = baseFactory(remult)
          if (opt) {
            r = {
              ...opt,
              ...r,
            } as any
          }
        }
      }
      return r as EntityOptions<unknown>
    }

    remultStatic.allEntities.push(target)
    setControllerSettings(target, { key })
    target[entityInfo] = factory
    target[entityInfo_key] = key
    return target
  }
}
