import type { ClassType } from '../../classType.js'
import type { FieldMetadata, FieldOptions } from '../column-interfaces.js'
import type { Remult } from '../context.js'
import type { DataProvider } from '../data-interfaces.js'
import type { RelationOptions, Repository } from './remult3.js'

export function relationInfoMemberInOptions(
  toEntityType: () => ClassType<any>,
  type: RelationFieldInfo['type'],
) {
  return {
    [relationInfoMember]: {
      toType: toEntityType,
      type: type,
    },
  } as FieldOptions
}

const relationInfoMember = Symbol.for('relationInfo')
/**
 * @deprecated
 */
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}

/**
 * @deprecated
 */
export interface RelationInfo {
  toType: () => any
  type: RelationFieldInfo['type']
}
const fieldRelationInfo = Symbol.for('fieldRelationInfo')
export function getRelationFieldInfo(field: FieldMetadata) {
  return field[fieldRelationInfo] as RelationFieldInfo | undefined
}

export interface RelationFieldInfo {
  type: 'reference' | 'toOne' | 'toMany'
  options: RelationOptions<any, any, any>
  toEntity: any
  toRepo: Repository<any>
}
export function verifyFieldRelationInfo(
  repo: Repository<any>,
  remult: Remult,
  dp: DataProvider,
) {
  for (const field of repo.fields.toArray()) {
    const r = getRelationInfo(field.options)
    if (r) {
      if (!field[fieldRelationInfo]) {
        const toEntity = r.toType()
        field[fieldRelationInfo] = {
          type: r.type,
          toEntity,
          options: field.options,
          toRepo: remult.repo(toEntity, dp),
        } satisfies RelationFieldInfo
      }
    }
  }
}
