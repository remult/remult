
import { ClassType } from "../../classType";
import { FieldMetadata } from "../column-interfaces";
import { Unobserve } from "../context";
import { EntityOptions as EntityOptions } from "../entity";
import { SortSegment } from "../sort";
import { entityEventListener } from "../__EntityValueProvider";




/*

## Presentation notes:
[] Review Setup
    [] common.ts - explain remult
    [] server/index

[] Create Entity
    [] create a class with title and completed.
    [] decorate it
    [] show swagger
        [] talk about paging
    [] add IdEntity
    [] show swagger
    [] Add Crud
    [] show swagger
    [] add a few tasks

[] App.tsx
    [] add task repo - it wraps axios - type of agent or service..
    [] copy paste insert etc...

[] skip line-through

[] Order by and where -  PAGING 
[] skip hide completed
[] validation:
    [] talk about saving,saved,validate...

[] Backend
    [] Iterate - explain that we run on all tasks on the server.
    [] create taskService - for set all
    [] backend method - talk about transaction and unit of work

    [] Propose to skip authorize implementation. - un intrusive, un opinionated
*/


export interface EntityRef<entityType> extends Subscribable {
    hasErrors(): boolean;
    undoChanges();
    save(): Promise<entityType>;
    reload(): Promise<entityType>;
    delete(): Promise<void>;
    isNew(): boolean;
    wasChanged(): boolean;
    wasDeleted(): boolean;
    fields: Fields<entityType>;
    error: string;
    getId(): any;
    repository: Repository<entityType>;
    metadata: EntityMetadata<entityType>
    toApiJson(): any;
    validate(): Promise<boolean>;
    readonly apiUpdateAllowed: boolean;
    readonly apiDeleteAllowed: boolean;
    readonly apiInsertAllowed: boolean;
    readonly isLoading: boolean;
}
export interface ControllerRef<entityType> extends Subscribable {
    hasErrors(): boolean;
    fields: Fields<entityType>;
    error: string;
    validate(): Promise<boolean>;
    readonly isLoading: boolean;
}
export interface RefSubscriberBase {
    reportChanged: () => void,
    reportObserved: () => void
}
export declare type RefSubscriber = (() => void) | RefSubscriberBase;
export interface Subscribable {
    // new to talk with Yoni;
    subscribe(listener: RefSubscriber): Unobserve;
}

export type Fields<entityType> = {
    [Properties in keyof OmitEB<entityType>]: entityType[Properties] extends { id: (number | string) } ? IdFieldRef<entityType, entityType[Properties]> : FieldRef<entityType, entityType[Properties]>
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>,
    [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>,
    toArray(): FieldRef<entityType, any>[]



}
export type FieldsMetadata<entityType> = {
    [Properties in keyof OmitEB<entityType>]: FieldMetadata
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldMetadata,
    [Symbol.iterator]: () => IterableIterator<FieldMetadata>,
    toArray(): FieldRef<FieldMetadata, any>[]


}


export type SortSegments<entityType> = {
    [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}
export interface IdFieldRef<entityType, valueType> extends FieldRef<entityType, valueType> {
    setId(id: valueType extends { id: number } ? number : valueType extends { id: string } ? string : (string | number))
}

export interface FieldRef<entityType = any, valueType = any> extends Subscribable {
    error: string;
    displayValue: string;
    value: valueType;
    originalValue: valueType;
    inputValue: string;
    valueChanged(): boolean;
    entityRef: EntityRef<entityType>;
    container: entityType;
    metadata: FieldMetadata<entityType>;
    load(): Promise<valueType>;
    valueIsNull(): boolean;
    originalValueIsNull(): boolean;
    validate(): Promise<boolean>;
}
export interface IdMetadata<entityType = any> {

    field: FieldMetadata<any>;
    getIdFilter(...ids: any[]): EntityFilter<entityType>;
    isIdField(col: FieldMetadata): boolean;
    createIdInFilter(items: entityType[]): EntityFilter<entityType>;

}

export interface EntityMetadata<entityType = any> {
    readonly idMetadata: IdMetadata<entityType>;
    readonly key: string,
    readonly fields: FieldsMetadata<entityType>,
    readonly caption: string;
    readonly options: EntityOptions;
    readonly entityType: ClassType<entityType>;
    readonly apiUpdateAllowed: boolean;
    readonly apiReadAllowed: boolean;
    readonly apiDeleteAllowed: boolean;
    readonly apiInsertAllowed: boolean;
    getDbName(): Promise<string>;
}

export declare type OmitEB<T> = Omit<T, keyof import('./RepositoryImplementation').EntityBase>
export interface Repository<entityType> {
    /**creates a json representation of the object */
    fromJson(x: any, isNew?: boolean): Promise<entityType>;
    metadata: EntityMetadata<entityType>;
    /** returns a result array based on the provided options */
    find(options?: FindOptions<entityType>): Promise<entityType[]>;
    query(options?: QueryOptions<entityType>): QueryResult<entityType>;
    findFirst(where?: EntityFilter<entityType>, options?: FindFirstOptions<entityType>): Promise<entityType>;
    findId(id: entityType extends { id: number } ? number : entityType extends { id: string } ? string : (string | number), options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
    count(where?: EntityFilter<entityType>): Promise<number>;
    create(item?: Partial<OmitEB<entityType>>): entityType;
    getEntityRef(item: entityType): EntityRef<entityType>;
    save(item: Partial<OmitEB<entityType>>): Promise<entityType>;
    save(item: Partial<OmitEB<entityType>>, originalId?: entityType extends { id: number } ? number : entityType extends { id: string } ? string : (string | number)): Promise<entityType>;
    save(item: Partial<OmitEB<entityType>>, create?: boolean): Promise<entityType>;
    delete(id: (entityType extends { id: number } ? number : entityType extends { id: string } ? string : (string | number))): Promise<void>;
    delete(item: entityType): Promise<void>;
    addEventListener(listener: entityEventListener<entityType>): Unobserve;
}
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {

    /** Determines the number of rows returned by the request, on the browser the default is 100 rows 
     * @example
     * this.products = await this.remult.repo(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    limit?: number;
    /** Determines the page number that will be used to extract the data 
     * @example
     * this.products = await this.remult.repo(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    page?: number;
}
/** Determines the order of rows returned by the query.
 * @example
 * await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
 * @example
 * await this.remult.repo(Products).find({ orderBy: { price: "asc", name: "asc" }})
 * @example
 * await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
 */
export declare type EntityOrderBy<entityType> = {
    [Properties in keyof Partial<OmitEB<entityType>>]?: "asc" | "desc"
}



export declare type EntityFilter<entityType> = {
    [Properties in keyof Partial<OmitEB<entityType>>]?: (
        Partial<OmitEB<entityType>>[Properties] extends (number | Date | undefined) ? ComparisonValueFilter<Partial<OmitEB<entityType>>[Properties]> :
        Partial<OmitEB<entityType>>[Properties] extends (string | undefined) ? ContainsStringValueFilter & ComparisonValueFilter<string> :
        Partial<OmitEB<entityType>>[Properties] extends (boolean | undefined) ? ValueFilter<boolean> :
        Partial<OmitEB<entityType>>[Properties] extends ({ id: (string | number) } | undefined) ? IdFilter<Partial<OmitEB<entityType>>[Properties]> :
        ValueFilter<Partial<OmitEB<entityType>>[Properties]>) & ContainsStringValueFilter;
} & {
    $or?: EntityFilter<entityType>[];
    $and?: EntityFilter<entityType>[];
}


export type ValueFilter<valueType> = valueType | valueType[] | {
    $ne?: valueType | valueType[],
    "!="?: valueType | valueType[],
}
export type ComparisonValueFilter<valueType> = ValueFilter<valueType> & {
    $gt?: valueType,
    ">"?: valueType,
    $gte?: valueType,
    ">="?: valueType,
    $lt?: valueType,
    "<"?: valueType,
    $lte?: valueType
    "<="?: valueType
}
export interface ContainsStringValueFilter {
    $contains?: string,
}
export type IdFilter<valueType> = ValueFilter<valueType> | {
    $id: ValueFilter<valueType extends { id: number } ? number : string>;
}


export interface LoadOptions<entityType> {
    load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[]
}
export interface FindOptionsBase<entityType> extends LoadOptions<entityType> {
    /** filters the data
    * @example
    * where p => p.price.isGreaterOrEqualTo(5)
    * @see For more usage examples see [EntityWhere](https://remult-ts.github.io/guide/ref_entitywhere)
    */
    where?: EntityFilter<entityType>;
    /** Determines the order in which the result will be sorted in
     * @see See [EntityOrderBy](https://remult-ts.github.io/guide/ref__entityorderby) for more examples on how to sort
     */
    orderBy?: EntityOrderBy<entityType>;
}
export interface FindFirstOptions<entityType> extends FindOptionsBase<entityType>, FindFirstOptionsBase<entityType> {



}
export interface FindFirstOptionsBase<entityType> extends LoadOptions<entityType> {
    /** default true
      */
    useCache?: boolean;

    createIfNotFound?: boolean;
}
export interface QueryOptions<entityType> extends FindOptionsBase<entityType> {
    pageSize?: number,
    progress?: { progress: (progress: number) => void };
}
export interface QueryResult<entityType> {
    getPage(pageNumber?: number): Promise<entityType[]>;
    count(): Promise<number>;
    forEach(what: (item: entityType) => Promise<any>): Promise<number>;
    paginator(): Promise<Paginator<entityType>>
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<entityType, entityType>>;
    };
}
export interface Paginator<entityType> {
    items: entityType[];
    count(): Promise<number>;
    hasNextPage: boolean;
    nextPage(): Promise<Paginator<entityType>>;
}


