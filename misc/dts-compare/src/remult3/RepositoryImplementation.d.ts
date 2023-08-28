import type { ClassType } from '../../classType';
import { LookupColumn } from '../column';
import type { FieldMetadata, FieldOptions, ValueConverter, ValueListItem } from '../column-interfaces';
import { Remult } from '../context';
import type { EntityOptions } from '../entity';
import type { ControllerRef, EntityFilter, EntityMetadata, EntityOrderBy, EntityRef, FieldRef, FieldsMetadata, FieldsRef, FindFirstOptions, FindFirstOptionsBase, FindOptions, IdMetadata, OmitEB, QueryOptions, QueryResult, Repository, Subscribable } from './remult3';
import type { RefSubscriber } from '.';
import type { entityEventListener } from '../__EntityValueProvider';
import type { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, ErrorInfo } from '../data-interfaces';
import type { Unsubscribe } from '../live-query/SubscriptionChannel';
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
    delete(id: entityType extends {
        id?: number;
    } ? number : entityType extends {
        id?: string;
    } ? string : string | number): Promise<void>;
    delete(item: entityType): Promise<void>;
    insert(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>;
    insert(item: Partial<OmitEB<entityType>>): Promise<entityType>;
    get fields(): FieldsMetadata<entityType>;
    validate(entity: Partial<OmitEB<entityType>>, ...fields: Extract<keyof OmitEB<entityType>, string>[]): Promise<ErrorInfo<entityType> | undefined>;
    update(id: entityType extends {
        id?: number;
    } ? number : entityType extends {
        id?: string;
    } ? string : string | number, item: Partial<OmitEB<entityType>>): Promise<entityType>;
    update(originalItem: Partial<OmitEB<entityType>>, item: Partial<OmitEB<entityType>>): Promise<entityType>;
    private getRefForExistingRow;
    save(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>;
    save(item: Partial<OmitEB<entityType>>): Promise<entityType>;
    liveQuery(options?: FindOptions<entityType>): any;
    find(options: FindOptions<entityType>, skipOrderByAndLimit?: boolean): Promise<entityType[]>;
    buildEntityDataProviderFindOptions(options: FindOptions<entityType>): Promise<EntityDataProviderFindOptions>;
    fromJsonArray(jsonItems: any[], load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[]): Promise<entityType[]>;
    private loadManyToOneForManyRows;
    private mapRawDataToResult;
    toJson(item: entityType | entityType[] | Promise<entityType> | Promise<entityType[]>): any;
    fromJson(json: any, newRow?: boolean): any;
    count(where?: EntityFilter<entityType>): Promise<number>;
    private cache;
    findFirst(where?: EntityFilter<entityType>, options?: FindFirstOptions<entityType>, skipOrderByAndLimit?: boolean): Promise<entityType>;
    private fieldsOf;
    create(item?: Partial<OmitEB<entityType>>): entityType;
    fixTypes(item: any): Promise<any>;
    findId(id: any, options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
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
    subscribe(listener: RefSubscriber): Unsubscribe;
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
    buildErrorInfoObject(): ErrorInfo<any>;
    abstract get fields(): FieldsRef<T>;
    catchSaveErrors(err: any): any;
    __clearErrorsAndReportChanged(): void;
    _reportChangedToEntityAndFields(): void;
    hasErrors(): boolean;
    copyDataToObject(): any;
    originalValues: any;
    saveOriginalData(): void;
    saveMoreOriginalData(): void;
    validate(): Promise<ErrorInfo<any>>;
    __validateEntity(): Promise<void>;
    __performColumnAndEntityValidations(): Promise<void>;
    toApiJson(includeRelatedEntities?: boolean): any;
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
    save(onlyTheseFieldsSentOnlyInTheCaseOfProxySaveWithPartialObject?: string[]): Promise<T>;
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
export declare function getControllerRef<fieldsContainerType>(container: fieldsContainerType, remultArg?: Remult): ControllerRef<fieldsContainerType>;
export declare class controllerRefImpl<T = any> extends rowHelperBase<T> implements ControllerRef<T> {
    constructor(columnsInfo: FieldOptions[], instance: any, remult: Remult);
    __performColumnAndEntityValidations(): Promise<void>;
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
    subscribe(listener: RefSubscriber): Unsubscribe;
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
    setId(id: string | number): void;
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
    private remult;
    constructor(settings: FieldOptions, entityDefs: EntityFullInfo<any>, remult: Remult);
    apiUpdateAllowed(item?: any): boolean;
    displayValue(item: any): string;
    get includedInApi(): boolean;
    toInput(value: any, inputType?: string): string;
    fromInput(inputValue: string, inputType?: string): any;
    getDbName(): Promise<string>;
    options: FieldOptions<any, any>;
    target: ClassType<any>;
    readonly: boolean;
    valueConverter: Required<ValueConverter<any>>;
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
    options: EntityOptions<T>;
    constructor(columnsInfo: FieldOptions[], entityInfo: EntityOptions, remult: Remult, entityType: ClassType<T>, key: string);
    apiUpdateAllowed(item: T): boolean;
    get apiReadAllowed(): boolean;
    apiDeleteAllowed(item: T): boolean;
    apiInsertAllowed(item: T): boolean;
    getEntityMetadataWithoutBreakingTheEntity(item: T): EntityRef<T>;
    dbNamePromise: Promise<string>;
    getDbName(): Promise<string>;
    idMetadata: IdMetadata<T>;
    fields: FieldsMetadata<T>;
    dbName: string;
    caption: string;
}
export declare function FieldType<valueType = any>(...options: (FieldOptions<any, valueType> | ((options: FieldOptions<any, valueType>, remult: Remult) => void))[]): (target: any, context?: any) => any;
export declare class Fields {
    /**
     * Stored as a JSON.stringify - to store as json use Fields.json
     */
    static object<entityType = any, valueType = any>(...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, valueType | undefined>, c?: any) => void;
    static json<entityType = any, valueType = any>(...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, valueType | undefined>, c?: any) => void;
    static dateOnly<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static date<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static integer<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static autoIncrement<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static number<entityType = any>(...options: (FieldOptions<entityType, Number> | ((options: FieldOptions<entityType, Number>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, number | undefined>, c?: any) => void;
    static createdAt<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static updatedAt<entityType = any>(...options: (FieldOptions<entityType, Date> | ((options: FieldOptions<entityType, Date>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, Date | undefined>, c?: any) => void;
    static uuid<entityType = any>(...options: (FieldOptions<entityType, string> | ((options: FieldOptions<entityType, string>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static cuid<entityType = any>(...options: (FieldOptions<entityType, string> | ((options: FieldOptions<entityType, string>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static string<entityType = any>(...options: (StringFieldOptions<entityType> | ((options: StringFieldOptions<entityType>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, string | undefined>, c?: any) => void;
    static boolean<entityType = any>(...options: (FieldOptions<entityType, boolean> | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void))[]): (target: any, context: string | ClassFieldDecoratorContextStub<entityType, boolean | undefined>, c?: any) => void;
}
export declare function isAutoIncrement(f: FieldMetadata): boolean;
export interface StringFieldOptions<entityType = any> extends FieldOptions<entityType, string> {
    maxLength?: number;
}
export declare function ValueListFieldType<valueType extends ValueListItem = any>(...options: (ValueListFieldOptions<any, valueType> | ((options: FieldOptions<any, valueType>, remult: Remult) => void))[]): (type: ClassType<valueType>, context?: any) => void;
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
export interface ClassFieldDecoratorContextStub<entityType, valueType> {
    readonly access: {
        set(object: entityType, value: valueType): void;
    };
    readonly name: string;
}
export interface ClassDecoratorContextStub<Class extends new (...args: any) => any = new (...args: any) => any> {
    readonly kind: 'class';
    readonly name: string | undefined;
    addInitializer(initializer: (this: Class) => void): void;
}
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
export declare function Field<entityType = any, valueType = any>(valueType: () => ClassType<valueType>, ...options: (FieldOptions<entityType, valueType> | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void))[]): (target: any, context: ClassFieldDecoratorContextStub<entityType, valueType | undefined> | string, c?: any) => void;
export declare const storableMember: unique symbol;
export declare function decorateColumnSettings<valueType>(settings: FieldOptions<any, valueType>, remult: Remult): FieldOptions<any, valueType>;
interface columnInfo {
    key: string;
    settings: (remult: Remult) => FieldOptions;
}
/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import  { Entity, Fields } from "remult";
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
export declare function Entity<entityType>(key: string, ...options: (EntityOptions<entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType> | ((options: EntityOptions<entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType>, remult: Remult) => void))[]): (target: any, info?: ClassDecoratorContextStub<entityType extends new (...args: any) => any ? entityType : never>) => any;
export declare class EntityBase {
    get _(): EntityRef<this>;
    save(): Promise<this>;
    assign(values: Partial<Omit<this, keyof EntityBase>>): this;
    delete(): Promise<void>;
    isNew(): boolean;
    get $(): FieldsRef<this>;
}
export declare class IdEntity extends EntityBase {
    id: string;
}
export declare class ControllerBase {
    protected remult: Remult;
    constructor(remult?: Remult);
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
    }): Unsubscribe;
}
export declare function getEntityMetadata<entityType>(entity: EntityMetadataOverloads<entityType>): EntityMetadata<entityType>;
export declare function getRepository<entityType>(entity: RepositoryOverloads<entityType>): Repository<entityType>;
export declare type EntityMetadataOverloads<entityType> = Repository<entityType> | EntityMetadata<entityType> | ClassType<entityType>;
export declare type RepositoryOverloads<entityType> = Repository<entityType> | ClassType<entityType>;
export declare function checkTarget(target: any): void;
export {};
