import { FieldMetadata } from '../src/column-interfaces';
import { Remult } from '../src/context';
import { SqlDatabase } from '../src/data-providers/sql-database';
import { EntityMetadata } from '../src/remult3';
export declare function postgresColumnSyntax(x: FieldMetadata, dbName: string): string;
export declare function verifyStructureOfAllEntities(db: SqlDatabase, remult: Remult): Promise<void>;
export declare class PostgresSchemaBuilder {
    private pool;
    private removeQuotes;
    private whereTableAndSchema;
    private schemaAndName;
    verifyStructureOfAllEntities(remult?: Remult): Promise<void>;
    ensureSchema(entities: EntityMetadata<any>[]): Promise<void>;
    createIfNotExist(entity: EntityMetadata): Promise<void>;
    addColumnIfNotExist<T extends EntityMetadata>(entity: T, c: (e: T) => FieldMetadata): Promise<void>;
    verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>;
    specifiedSchema: string;
    constructor(pool: SqlDatabase, schema?: string);
}
