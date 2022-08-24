import { FieldMetadata, FieldOptions, ValueConverter, ValueListItem } from "../column-interfaces";
import { EntityOptions } from "../entity";
import { LookupColumn } from '../column';
import { EntityMetadata, FieldRef, FieldsRef, EntityFilter, FindOptions, Repository, EntityRef, QueryOptions, QueryResult, EntityOrderBy, FieldsMetadata, IdMetadata, FindFirstOptionsBase, FindFirstOptions, OmitEB, Subscribable, ControllerRef } from "./remult3";
import { ClassType } from "../../classType";
import { Remult, Unobserve } from "../context";
import { entityEventListener } from "../__EntityValueProvider";
import { DataProvider, EntityDataProvider } from "../data-interfaces";
import { RefSubscriber } from ".";
export declare class RepositoryImplementation<entityType> implements Repository<entityType> {
    private entity;
    remult: Remult;
    private dataProvider;
    createAfterFilter(orderBy: EntityOrderBy<entityType>, lastRow: entityType): Promise<EntityFilter<entityType>>;
    private _info;
    private __edp;
    private get edp();
    constructor(entity: ClassType<entityType>, remult: Remult, dataProvider: DataProvider);
    idCache: Map<any, any>;
    getCachedById(id: any): entityType;
    getCachedByIdAsync(id: any): Promise<entityType>;
    addToCache(item: entityType): void;
    get metadata(): EntityMetadata<entityType>;
    listeners: entityEventListener<entityType>[];
    addEventListener(listener: entityEventListener<entityType>): () => void;
    query(options?: QueryOptions<entityType>): QueryResult<entityType>;
    getEntityRef(entity: entityType): EntityRef<entityType>;
    delete(id: (entityType extends {
        id?: number;
    } ? number : entityType extends {
        id?: string;
    } ? string : (string | number))): Promise<void>;
    delete(item: entityType): Promise<void>;
    insert(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>;
    insert(item: Partial<OmitEB<entityType>>): Promise<entityType>;
    update(id: (entityType extends {
        id?: number;
    } ? number : entityType extends {
        id?: string;
    } ? string : (string | number)), entity: Partial<OmitEB<entityType>>): Promise<entityType>;
    private getRefForExistingRow;
    save(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>;
    save(item: Partial<OmitEB<entityType>>): Promise<entityType>;
    find(options: FindOptions<entityType>): Promise<entityType[]>;
    private mapRawDataToResult;
    count(where?: EntityFilter<entityType>): Promise<number>;
    private cache;
    findFirst(where?: EntityFilter<entityType>, options?: FindFirstOptions<entityType>): Promise<entityType>;
    private fieldsOf;
    create(item?: Partial<OmitEB<entityType>>): entityType;
    fromJson(json: any, newRow?: boolean): Promise<entityType>;
    findId(id: any, options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
    private translateWhereToFilter;
}
export declare function __updateEntityBasedOnWhere<T>(entityDefs: EntityMetadata<T>, where: EntityFilter<T>, r: T): void;
export declare type EntityOptionsFactory = (remult: Remult) => EntityOptions;
export declare const entityInfo: unique symbol;
export declare const entityInfo_key: unique symbol;
export declare function getEntitySettings<T>(entity: ClassType<T>, throwError?: boolean): EntityOptionsFactory;
export declare function getEntityKey(entity: ClassType<any>): string;
export declare const columnsOfType: Map<any, columnInfo[]>;
export declare function createOldEntity<T>(entity: ClassType<T>, remult: Remult): EntityFullInfo<T>;
declare abstract class rowHelperBase<T> {
    protected columnsInfo: FieldOptions[];
    protected instance: T;
    protected remult: Remult;
    _error: string;
    get error(): string;
    set error(val: string);
    constructor(columnsInfo: FieldOptions[], instance: T, remult: Remult);
    _subscribers: SubscribableImp;
    subscribe(listener: RefSubscriber): Unobserve;
    _isLoading: boolean;
    initSubscribers(): void;
    get isLoading(): boolean;
    set isLoading(val: boolean);
    lookups: Map<string, LookupColumn<any>>;
    waitLoad(): Promise<void>;
    errors: {
        [key: string]: string;
    };
    protected __assertValidity(): void;
    abstract get fields(): FieldsRef<T>;
    catchSaveErrors(err: any): any;
    __clearErrorsAndReportChanged(): void;
    _reportChangedToEntityAndFields(): void;
    hasErrors(): boolean;
    copyDataToObject(): any;
    originalValues: any;
    saveOriginalData(): void;
    saveMoreOriginalData(): void;
    validate(): Promise<boolean>;
    __validateEntity(): Promise<void>;
    __performColumnAndEntityValidations(): Promise<void>;
    toApiJson(): any;
    _updateEntityBasedOnApi(body: any): Promise<void>;
}
export declare class rowHelperImplementation<T> extends rowHelperBase<T> implements EntityRef<T> {
    private info;
    repository: RepositoryImplementation<T>;
    private edp;
    private _isNew;
    constructor(info: EntityFullInfo<T>, instance: T, repository: RepositoryImplementation<T>, edp: EntityDataProvider, remult: Remult, _isNew: boolean);
    get apiUpdateAllowed(): boolean;
    get apiDeleteAllowed(): boolean;
    get apiInsertAllowed(): boolean;
    metadata: EntityMetadata<T>;
    getId(): any;
    saveMoreOriginalData(): void;
    private _wasDeleted;
    wasDeleted(): boolean;
    undoChanges(): void;
    reload(): Promise<T>;
    private _columns;
    get fields(): FieldsRef<T>;
    private _saving;
    save(): Promise<T>;
    private getIdFilter;
    delete(): Promise<void>;
    loadDataFrom(data: any, loadItems?: FieldMetadata[]): Promise<void>;
    id: any;
    originalId: any;
    getOriginalId(): any;
    private calcServerExpression;
    isNew(): boolean;
    wasChanged(): boolean;
    __performColumnAndEntityValidations(): Promise<void>;
}
export declare function getFields<fieldsContainerType>(container: fieldsContainerType, remult?: Remult): FieldsRef<fieldsContainerType>;
export declare function getControllerRef<fieldsContainerType>(container: fieldsContainerType, remult?: Remult): ControllerRef<fieldsContainerType>;
export declare class controllerRefImpl<T = any> extends rowHelperBase<T> implements ControllerRef<T> {
    constructor(columnsInfo: FieldOptions[], instance: any, remult: Remult);
    __performColumnAndEntityValidations(): Promise<void>;
    errors: {
        [key: string]: string;
    };
    originalValues: any;
    fields: FieldsRef<T>;
}
export declare class FieldRefImplementation<entityType, valueType> implements FieldRef<entityType, valueType> {
    private settings;
    metadata: FieldMetadata;
    container: any;
    private helper;
    private rowBase;
    constructor(settings: FieldOptions, metadata: FieldMetadata, container: any, helper: EntityRef<entityType>, rowBase: rowHelperBase<entityType>);
    _subscribers: SubscribableImp;
    subscribe(listener: RefSubscriber): Unobserve;
    valueIsNull(): boolean;
    originalValueIsNull(): boolean;
    load(): Promise<valueType>;
    target: ClassType<any>;
    reportObserved(): void;
    reportChanged(): void;
    get error(): string;
    set error(error: string);
    get displayValue(): string;
    get value(): any;
    set value(value: any);
    get originalValue(): any;
    private rawOriginalValue;
    setId(id: (string | number)): void;
    getId(): any;
    get inputValue(): string;
    set inputValue(val: string);
    valueChanged(): boolean;
    entityRef: EntityRef<any>;
    __performValidation(): Promise<void>;
    validate(): Promise<boolean>;
}
export declare function getEntityRef<entityType>(entity: entityType, throwException?: boolean): EntityRef<entityType>;
export declare const CaptionTransformer: {
    transformCaption: (remult: Remult, key: string, caption: string) => string;
};
export declare function buildCaption(caption: string | ((remult: Remult) => string), key: string, remult: Remult): string;
export declare class columnDefsImpl implements FieldMetadata {
    private settings;
    private entityDefs;
    constructor(settings: FieldOptions, entityDefs: EntityFullInfo<any>, remult: Remult);
    dbNamePromise: Promise<string>;
    getDbName(): Promise<string>;
    options: FieldOptions<any, any>;
    target: ClassType<any>;
    readonly: boolean;
    valueConverter: ValueConverter<any>;
    allowNull: boolean;
    caption: string;
    get dbName(): any;
    inputType: string;
    key: string;
    get dbReadOnly(): boolean;
    isServerExpression: boolean;
    valueType: any;
}
declare class EntityFullInfo<T> implements EntityMetadata<T> {
    columnsInfo: FieldOptions[];
    entityInfo: EntityOptions;
    private remult;
    readonly entityType: ClassType<T>;
    readonly key: string;
    options: EntityOptions<any>;
    constructor(columnsInfo: FieldOptions[], entityInfo: EntityOptions, remult: Remult, entityType: ClassType<T>, key: string);
    get apiUpdateAllowed(): boolean;
    get apiReadAllowed(): boolean;
    get apiDeleteAllowed(): boolean;
    get apiInsertAllowed(): boolean;
    dbNamePromise: Promise<string>;
    getDbName(): Promise<string>;
    idMetadata: IdMetadata<T>;
    fields: FieldsMetadata<T>;
    dbName: string;
    caption: string;
}
export declare function FieldType<valueType = any>(...options: (FieldOptions<any, valueType> | ((options: FieldOptions<any, valueType>, remult: Remult) => void))[]): (target: any) => any;
export declare class Fields {
    static object<entityType = any, valueType = any>(...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static dateOnly<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static date<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static integer<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static autoIncrement<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static number<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static uuid<entityType = any>(...options: (FieldOptions<entityType, string> | ((options: FieldOptions<entityType, string>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static string<entityType = any>(...options: (StringFieldOptions<entityType> | ((options: StringFieldOptions<entityType>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
    static boolean<entityType = any>(...options: (FieldOptions<entityType, boolean> | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
}
export declare function isAutoIncrement(f: FieldMetadata): boolean;
export interface StringFieldOptions<entityType = any> extends FieldOptions<entityType, string> {
    maxLength?: number;
}
export declare function ValueListFieldType<valueType extends ValueListItem = any>(...options: (ValueListFieldOptions<any, valueType> | ((options: FieldOptions<any, valueType>, remult: Remult) => void))[]): (type: ClassType<valueType>) => void;
export interface ValueListFieldOptions<entityType, valueType> extends FieldOptions<entityType, valueType> {
    getValues?: () => valueType[];
}
export declare class ValueListInfo<T extends ValueListItem> implements ValueConverter<T> {
    private valueListType;
    static get<T extends ValueListItem>(type: ClassType<T>): ValueListInfo<T>;
    private byIdMap;
    private values;
    isNumeric: boolean;
    private constructor();
    getValues(): T[];
    byId(key: any): T;
    fromJson(val: any): T;
    toJson(val: T): any;
    fromDb(val: any): T;
    toDb(val: T): any;
    toInput(val: T, inputType: string): string;
    fromInput(val: string, inputType: string): T;
    displayValue?(val: T): string;
    fieldTypeInDb?: string;
    inputType?: string;
}
export declare function getValueList<T>(field: FieldRef<T>): T[];
export declare function getValueList<T>(field: FieldMetadata<T>): T[];
export declare function getValueList<T>(type: ClassType<T>): T[];
/**Decorates fields that should be used as fields.
 * for more info see: [Field Types](https://remult.dev/docs/field-types.html)
 *
 * FieldOptions can be set in two ways:
 * @example
 * // as an object
 * @Fields.string({ includeInApi:false })
 * title='';
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Fields.string((options,remult) => options.includeInApi = true)
 * title='';
 */
export declare function Field<entityType = any, valueType = any>(valueType: () => ClassType<valueType>, ...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, key: any, c?: any) => void;
export declare const storableMember: unique symbol;
export declare function decorateColumnSettings<valueType>(settings: FieldOptions<any, valueType>, remult: Remult): FieldOptions<any, valueType>;
interface columnInfo {
    key: string;
    settings: (remult: Remult) => FieldOptions;
}
export declare type BuildEntityFields<entityType> = {
    [Properties in keyof Partial<OmitEB<entityType>>]: any;
};
export declare function BuildEntity<entityType>(c: ClassType<entityType>, key: string, fields: BuildEntityFields<entityType>, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]): void;
/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import { Entity, Fields } from "remult";
 * @Entity("tasks", {
 *    allowApiCrud: true
 * })
 * export class Task {
 *    @Fields.uuid()
 *    id!: string;
 *    @Fields.string()
 *    title = '';
 *    @Fields.boolean()
 *    completed = false;
 * }
 * @note
 * EntityOptions can be set in two ways:
 * @example
 * // as an object
 * @Entity("tasks",{ allowApiCrud:true })
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Entity("tasks", (options,remult) => options.allowApiCrud = true)
 */
export declare function Entity<entityType>(key: string, ...options: (EntityOptions<entityType> | ((options: EntityOptions<entityType>, remult: Remult) => void))[]): (target: any) => any;
export declare class EntityBase {
    get _(): EntityRef<this>;
    save(): Promise<this>;
    assign(values: Partial<Omit<this, keyof EntityBase>>): this;
    delete(): Promise<void>;
    isNew(): boolean;
    get $(): FieldsRef<this>;
}
export declare class ControllerBase {
    protected remult: Remult;
    constructor(remult: Remult);
    assign(values: Partial<Omit<this, keyof EntityBase>>): this;
    get $(): FieldsRef<this>;
    get _(): ControllerRef<this>;
}
declare class SubscribableImp implements Subscribable {
    reportChanged(): void;
    reportObserved(): void;
    private _subscribers;
    subscribe(listener: (() => void) | {
        reportChanged: () => void;
        reportObserved: () => void;
    }): Unobserve;
}
export {};
