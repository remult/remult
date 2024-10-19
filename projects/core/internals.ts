import { remultStatic } from './src/remult-static.js'

export {
  getRelationInfo,
  getRelationFieldInfo,
  type RelationFieldInfo,
  type RelationInfo,
  type RelationFields,
} from './src/remult3/relationInfoMember.js'
export {
  decorateColumnSettings,
  controllerRefImpl,
  getControllerRef,
} from './src/remult3/RepositoryImplementation.js'
export { getEntitySettings } from './src/remult3/getEntityRef.js'
export { __updateEntityBasedOnWhere } from './src/filter/filter-interfaces.js'
export const actionInfo = remultStatic.actionInfo

export type { ClassType } from './classType.js'

export { flags } from './src/remult3/remult3.js'
