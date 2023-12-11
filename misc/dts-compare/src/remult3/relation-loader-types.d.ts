import type { ClassType } from '../../classType';
import type { EntityMetadata, FindOptions } from './remult3';
export interface RelationLoaderHelper<toEntity> {
    metadata: EntityMetadata<toEntity>;
    entityType: ClassType<toEntity>;
    find(options: FindOptions<toEntity>): Promise<toEntity[]>;
}
