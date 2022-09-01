import { FieldMetadata } from '../src/column-interfaces.js';
import { Remult } from '../src/context.js';
import { SqlDatabase } from '../src/data-providers/sql-database.js';
import { EntityMetadata } from '../src/remult3/index.js';
export declare function postgresColumnSyntax(x: FieldMetadata, dbName: string): string;
export declare function verifyStructureOfAllEntities(db: SqlDatabase, remult: Remult): Promise<void>;
export declare class PostgresSchemaBuilder {
    private pool;
    verifyStructureOfAllEntities(remult: Remult): Promise<void>;
    createIfNotExist(entity: EntityMetadata): Promise<void>;
    addColumnIfNotExist<T extends EntityMetadata>(entity: T, c: ((e: T) => FieldMetadata)): Promise<void>;
    verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>;
    additionalWhere: string;
    constructor(pool: SqlDatabase, schema?: string);
}
