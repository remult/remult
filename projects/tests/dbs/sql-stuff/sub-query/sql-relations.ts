import { ClassType } from '../../../../core/classType.js'
import { EntityFilter } from '../../../../core/index.js'
import { ArrayItemType } from './sub-query.js'

export function sqlRelations<entityType>(
  forEntity: ClassType<entityType>,
): SqlRelations<entityType> {}

export interface SqlRelationTool<toEntity> {
  count(where?: EntityFilter<toEntity>): string
}

export type SqlRelations<entityType> = {
  [p in keyof entityType]-?: SqlRelationTool<ArrayItemType<entityType[p]>>
}

let x: Record<string, SqlRelations<any>> = {}
