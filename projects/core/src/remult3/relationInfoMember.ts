import type { FieldOptions } from '../column-interfaces'
import type { RelationInfo } from './remult3'

export const relationInfoMember = '!remult!relationInfo' //[ ] - don't want to make symbol - so that users can get to this data if they want  to
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}
