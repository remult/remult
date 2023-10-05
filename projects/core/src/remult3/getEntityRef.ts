import type { ClassType } from '../../classType.js'
import type { EntityOptionsFactory } from './RepositoryImplementation.js'
import type { EntityRef } from './remult3.js'

export function getEntityRef<entityType>(
  entity: entityType,
  throwException = true,
): EntityRef<entityType> {
  let x = entity[entityMember]
  if (!x && throwException)
    throw new Error(
      'item ' +
        entity.constructor.name +
        ' was not initialized using a context',
    )
  return x
}

export const entityMember = Symbol('entityMember')

export const entityInfo = Symbol('entityInfo')
export const entityInfo_key = Symbol('entityInfo_key')

export function getEntitySettings<T>(
  entity: ClassType<T>,
  throwError = true,
): EntityOptionsFactory {
  if (entity === undefined)
    if (throwError) {
      throw new Error('Undefined is not an entity :)')
    } else return undefined
  let info: EntityOptionsFactory = Reflect.getMetadata(entityInfo, entity)
  if (!info && throwError)
    throw new Error(
      entity.prototype.constructor.name +
        " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?",
    )

  return info
}
export function getEntityKey(entity: ClassType<any>): string {
  return Reflect.getMetadata(entityInfo_key, entity)
}
