import type { Remult } from '../context'
import { allEntities, setControllerSettings } from '../context'
import type { EntityOptions } from '../entity'
import type { customFilterInfo } from '../filter/filter-interfaces'
import { entityInfo, entityInfo_key, getEntitySettings } from './getEntityRef'
import type { EntityOptionsFactory } from './RepositoryImplementation'
import type { ClassDecoratorContextStub } from './remult3'

/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import  { Entity, Fields } from "remult";
 * @Entity("tasks", {
 *    allowApiCrud: true
 * })
 * export class Task {
 *    @Fields.uuid()
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
    target,
    info?: ClassDecoratorContextStub<
      entityType extends new (...args: any) => any ? entityType : never
    >,
  ) => {
    for (const rawFilterMember in target) {
      if (Object.prototype.hasOwnProperty.call(target, rawFilterMember)) {
        const element = target[rawFilterMember] as customFilterInfo<any>
        if (element?.rawFilterInfo?.rawFilterTranslator) {
          if (!element.rawFilterInfo.key)
            element.rawFilterInfo.key = rawFilterMember
        }
      }
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
            }
          }
        }
      }
      return r
    }

    allEntities.push(target)
    setControllerSettings(target, { key })
    Reflect.defineMetadata(entityInfo, factory, target)
    Reflect.defineMetadata(entityInfo_key, key, target)
    return target
  }
}
