import type { FieldOptions } from '../column-interfaces.js'
import type { RelationInfo } from './remult3.js'

export const relationInfoMember = Symbol.for('relationInfo')
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}
