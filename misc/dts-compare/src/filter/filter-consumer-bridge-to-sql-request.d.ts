import type { FieldMetadata } from '../column-interfaces';
import type { EntityMetadataOverloads, RepositoryOverloads } from '../remult3/RepositoryImplementation';
import type { EntityFilter, OmitEB } from '../remult3/remult3';
import type { SqlCommandWithParameters } from '../sql-command';
import type { Filter, FilterConsumer } from './filter-interfaces';
export declare class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
    private r;
    private nameProvider;
    private where;
    _addWhere: boolean;
    promises: Promise<void>[];
    resolveWhere(): Promise<string>;
    constructor(r: SqlCommandWithParameters, nameProvider: EntityDbNamesBase);
    custom(key: string, customItem: any): void;
    or(orElements: Filter[]): void;
    isNull(col: FieldMetadata): void;
    isNotNull(col: FieldMetadata): void;
    isIn(col: FieldMetadata, val: any[]): void;
    isEqualTo(col: FieldMetadata, val: any): void;
    isDifferentFrom(col: FieldMetadata, val: any): void;
    isGreaterOrEqualTo(col: FieldMetadata, val: any): void;
    isGreaterThan(col: FieldMetadata, val: any): void;
    isLessOrEqualTo(col: FieldMetadata, val: any): void;
    isLessThan(col: FieldMetadata, val: any): void;
    containsCaseInsensitive(col: FieldMetadata, val: any): void;
    private add;
    private addToWhere;
    databaseCustom(databaseCustom: CustomSqlFilterObject): void;
}
export type CustomSqlFilterBuilderFunction = (builder: CustomSqlFilterBuilder) => void | Promise<any>;
export interface CustomSqlFilterObject {
    buildSql: CustomSqlFilterBuilderFunction;
}
export declare class CustomSqlFilterBuilder {
    private r;
    constructor(r: SqlCommandWithParameters);
    sql: string;
    addParameterAndReturnSqlToken<valueType>(val: valueType, field?: FieldMetadata<valueType>): string;
    filterToRaw<entityType>(repo: RepositoryOverloads<entityType>, condition: EntityFilter<entityType>): Promise<string>;
}
export declare function isDbReadonly<entityType>(field: FieldMetadata, dbNames: EntityDbNames<entityType>): boolean;
export declare type EntityDbNamesBase = {
    $entityName: string;
    $dbNameOf(field: FieldMetadata<any> | string): string;
    toString(): string;
};
export declare type EntityDbNames<entityType> = {
    [Properties in keyof Required<OmitEB<entityType>>]: string;
} & EntityDbNamesBase;
export declare function dbNamesOf<entityType>(repo: EntityMetadataOverloads<entityType>): Promise<EntityDbNames<entityType>>;
