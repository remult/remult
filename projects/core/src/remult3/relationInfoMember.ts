import type { FieldOptions } from '../column-interfaces.js'
import type { RelationInfo } from './remult3.js'

export const relationInfoMember = Symbol('relationInfo')
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}
