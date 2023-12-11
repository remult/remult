import type { FieldOptions } from '../column-interfaces'
import type { RelationInfo } from './remult3'

export const relationInfoMember = Symbol('relationInfo')
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}
