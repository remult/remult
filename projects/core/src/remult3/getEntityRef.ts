import type { ClassType } from '../../classType.js'
import type { EntityOptionsFactory } from './RepositoryImplementation.js'
import type { EntityRef } from './remult3.js'

/**
 * Retrieves the EntityRef object associated with the specified entity instance.
 * The EntityRef provides methods for performing operations on the entity instance.
 * @param {entityType} entity - The entity instance.
 * @param {boolean} [throwException=true] - Indicates whether to throw an exception if the EntityRef object cannot be retrieved.
 * @returns {EntityRef<entityType>} The EntityRef object associated with the specified entity instance.
 * @throws {Error} If throwException is true and the EntityRef object cannot be retrieved.
 * @see [Active Record & EntityBase](https://remult.dev/docs/active-record)
 */
export function getEntityRef<entityType>(
  entity: entityType,
  throwException = true,
): EntityRef<entityType> {
  if (!entity) throw new Error('entity is undefined')
  let x = (entity as any)[entityMember]
  if (!x && throwException)
    throw new Error(
      'item ' +
        ((entity as any).constructor?.name || entity) +
        ' was not initialized using a context',
    )
  return x
}

export const entityMember = Symbol.for('entityMember')

export const entityInfo = Symbol.for('entityInfo')
export const entityInfo_key = Symbol.for('entityInfo_key')

export function getEntitySettings<T>(
  entity: ClassType<T>,
  throwError = true,
): EntityOptionsFactory | undefined {
  if (entity === undefined)
    if (throwError) {
      throw new Error('Undefined is not an entity :)')
    } else return undefined
  let info: EntityOptionsFactory = (entity as any)[entityInfo]
  if (!info && throwError)
    throw new Error(
      entity.prototype.constructor.name +
        " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?",
    )
  return info
}
export function getEntityKey(entity: ClassType<any>): string {
  return (entity as any)[entityInfo_key]
}
