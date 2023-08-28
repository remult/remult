import type { FieldMetadata } from '../column-interfaces';
import type { Remult } from '../context';
import type { EntityFilter, EntityMetadata } from '../remult3';
export declare class Filter {
    private apply?;
    constructor(apply?: (add: FilterConsumer) => void);
    __applyToConsumer(add: FilterConsumer): void;
    static resolve<entityType>(filter: EntityFilter<entityType> | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)): Promise<EntityFilter<entityType>>;
    static createCustom<entityType>(rawFilterTranslator: (unused: never, r: Remult) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>, key?: string): (() => EntityFilter<entityType>) & customFilterInfo<entityType>;
    static createCustom<entityType, argsType>(rawFilterTranslator: (args: argsType, r: Remult) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>, key?: string): ((y: argsType) => EntityFilter<entityType>) & customFilterInfo<entityType>;
    static fromEntityFilter<T>(entity: EntityMetadata<T>, whereItem: EntityFilter<T>): Filter;
    toJson(): any;
    static entityFilterToJson<T>(entityDefs: EntityMetadata<T>, where: EntityFilter<T>): any;
    static entityFilterFromJson<T>(entityDefs: EntityMetadata<T>, packed: any): EntityFilter<T>;
    static translateCustomWhere<T>(r: Filter, entity: EntityMetadata<T>, remult: Remult): Promise<Filter>;
}
export declare class filterHelper {
    metadata: FieldMetadata;
    constructor(metadata: FieldMetadata);
    processVal(val: any): any;
    contains(val: string): Filter;
    isLessThan(val: any): Filter;
    isGreaterOrEqualTo(val: any): Filter;
    isNotIn(values: any[]): Filter;
    isDifferentFrom(val: any): Filter;
    isLessOrEqualTo(val: any): Filter;
    isGreaterThan(val: any): Filter;
    isEqualTo(val: any): Filter;
    isIn(val: any[]): Filter;
}
export interface FilterConsumer {
    or(orElements: Filter[]): any;
    isEqualTo(col: FieldMetadata, val: any): void;
    isDifferentFrom(col: FieldMetadata, val: any): void;
    isNull(col: FieldMetadata): void;
    isNotNull(col: FieldMetadata): void;
    isGreaterOrEqualTo(col: FieldMetadata, val: any): void;
    isGreaterThan(col: FieldMetadata, val: any): void;
    isLessOrEqualTo(col: FieldMetadata, val: any): void;
    isLessThan(col: FieldMetadata, val: any): void;
    containsCaseInsensitive(col: FieldMetadata, val: any): void;
    isIn(col: FieldMetadata, val: any[]): void;
    custom(key: string, customItem: any): void;
    databaseCustom(databaseCustom: any): void;
}
export declare class AndFilter extends Filter {
    readonly filters: Filter[];
    constructor(...filters: Filter[]);
    add(filter: Filter): void;
}
export declare class OrFilter extends Filter {
    readonly filters: Filter[];
    constructor(...filters: Filter[]);
}
export declare const customUrlToken = "$custom$";
export declare const customDatabaseFilterToken = "$db$";
export declare class FilterSerializer implements FilterConsumer {
    result: any;
    constructor();
    databaseCustom(databaseCustom: any): void;
    custom(key: any, customItem: any): void;
    hasUndefined: boolean;
    add(key: string, val: any): void;
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
}
export declare function entityFilterToJson<T>(entityDefs: EntityMetadata<T>, where: EntityFilter<T>): any;
export declare function buildFilterFromRequestParameters(entity: EntityMetadata, filterInfo: {
    get: (key: string) => any;
}): EntityFilter<any>;
export interface customFilterInfo<entityType> {
    rawFilterInfo: {
        key: string;
        rawFilterTranslator: (args: any, r: Remult) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>;
    };
}
