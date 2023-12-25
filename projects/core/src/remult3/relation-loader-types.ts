import type { ClassType } from '../../classType.js'
import type { EntityMetadata, FindOptions } from './remult3.js'

export interface RelationLoaderHelper<toEntity> {
  metadata: EntityMetadata<toEntity>
  entityType: ClassType<toEntity>
  find(options: FindOptions<toEntity>): Promise<toEntity[]>
}
