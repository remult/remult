import { CompoundIdField } from '../column';
import type { EntityMetadata } from "./remult3";

export function getId<entityType>(meta: EntityMetadata<entityType>, instance: entityType) {
    if (meta.idMetadata.field instanceof CompoundIdField)
        return meta.idMetadata.field.getId(instance);

    else
        return instance[meta.idMetadata.field.key];
}
