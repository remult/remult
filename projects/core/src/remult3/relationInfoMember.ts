import type { FieldOptions } from '../column-interfaces'
import type { RelationInfo } from './remult3'

export const relationInfoMember = '!remult!relationInfo' //[ ] - make symbol and expose in `remult/internals`
export function getRelationInfo(options: FieldOptions) {
  return options?.[relationInfoMember] as RelationInfo
}
