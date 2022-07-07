import { SqlCommand } from "../sql-command";
import { Filter, FilterConsumer } from './filter-interfaces';
import { FieldMetadata } from "../column-interfaces";
import { EntityMetadata } from "../..";
export declare class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
    private r;
    private nameProvider;
    private where;
    _addWhere: boolean;
    promises: Promise<void>[];
    resolveWhere(): Promise<string>;
    constructor(r: SqlCommand, nameProvider: dbNameProvider);
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
export declare type CustomSqlFilterBuilderFunction = (builder: CustomSqlFilterBuilder) => void | Promise<any>;
export interface CustomSqlFilterObject {
    buildSql: CustomSqlFilterBuilderFunction;
}
export declare class CustomSqlFilterBuilder {
    private r;
    constructor(r: SqlCommand);
    sql: string;
    addParameterAndReturnSqlToken<valueType>(val: valueType, field?: FieldMetadata<valueType>): string;
}
export declare function getDbNameProvider(meta: EntityMetadata): Promise<dbNameProvider>;
export declare class dbNameProviderImpl {
    map: Map<string, string>;
    nameOf(field: FieldMetadata<any>): string;
    entityName: string;
    isDbReadonly(x: FieldMetadata): boolean;
}
export interface dbNameProvider {
    nameOf(field: FieldMetadata<any>): string;
    entityName: string;
    isDbReadonly(x: FieldMetadata): boolean;
}
