
import { ClassType } from "../../classType";
import { FieldMetadata } from "../column-interfaces";
import { IterateToArrayOptions, Unobserve } from "../context";
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


## TODO
[] exclude properties from type https://stackoverflow.com/questions/51804810/how-to-remove-fields-from-a-typescript-interface-via-extension/51804844
[] where: HelpersBase.active as EntityFilter<Helpers> -  
[] test api with and - uncomment and see error
[] https://rjsf-team.github.io/react-jsonschema-form/
[] https://github.com/build-security/react-rbac-ui-manager/blob/main/example/index.tsx
[] react admin



[] find a solution for expect(task).toEqual({id:1,blabla:'asda}) - currently it doesn't work well with entity.
[] create a todo app using "normal" node js - and create a refactoring video
[] write an article about the different usages of backend method:
    [] auto increment id
    [] static
    [] entity
    [] controller
    [] and usage FieldType - to send complex parameters
    [] type augmentation
[] https://docusaurus.io/

[] google sheets gateway
[] consider "class-validator", integration
[] typeorm gateway - https://typeorm.io/#/separating-entity-definition
[] sqlite
[] check sending field types to custom filter
[] dynamo db
[] graphql
    https://snipcart.com/blog/graphql-nodejs-express-tutorial
    https://graphql.org/graphql-js


[] graphql
    []doesn't like entity names with -
    [] work on dates
    [] ne of many (same as not in, may require different api)
    [] maybe equal and in should be the saml api
    [] update, insert, delete

## TODO Docs
[] doc field types (date etc... value converter and more)
[] doc value list column - and it's usage as strategy
[] fix tutorial images


## Todo Angular Material
[] make sure that on the grid or in predefined filter, adding a filter to the same field - doesn't open values that you're not supposed to see.
[V] test why date is equal to null - didn't work
[] readonly doesn't work on checkbox in area
[] add id lookup in remult angular
[] insert the column selection into the grid button.
[] figure out why field with basket type in a controller did not work with the combo
[] move one2many.items to remult angular - and make is a subscriber


## Project to fix
[]code samples

[V]todo angular
[V]todo react
[V] bezkoder react
[V] bekoder vue
[] upgrade all satelite projects to latest remult
[V] upgrade Northwind to latest remult
[V] update  Northwind to use AuthService
[V] update  Northwind to use skip tests
[V] update  Northwind to use strict

[V] change structure of remult projects - to include projects/core projects/test-angular and under it, everything.



## Yoni TODO
[] fix helmet non http - http://itimet.herokuapp.com/
[] fix FilterFactories in the case of optional fields, to handle gracefully the fields metadata and filter etc.... - tried -? (based on the Required Implementation, but it breaks Fields<any> = Fields<Product>)
[] add to iterator - nextPage or something that brings back the page as a set array. something to use not just in the for await scenario
   iterator(): {
        next: () => Promise<IteratorResult<entityType, entityType>>;
        nextArray:(num:number) => Promise<IteratorResult<entityType[], entityType[]>>;
    };

[] other name for load in find, that indicates that load only loads the detailed fields - not just the lazy ones.
[] Rename Allowed and InstanceAllowed, and Allow
[] field container type vs entity type vs target

[] Docs
    [] rewrite readme.md > Entities + CRUD, BackendMethods, Authorization
        [V] make sure readme is updated in npmjs.com
    [] getting started > npm i, connect to db, initExpress, init frontend
    [] Tutorials > Angular,React,Vue
    [] API reference in Docs
        [] determine a few main types which should appear (Remult, Entity, Field, Controller, BackendMethod, etc...)
            [] EntityOptions members should be listed in the "Entity" reference page etc (if possible)
        [] review existing texts

[] Housekeeping
    [] Remote unnecessary files from repo


## review with Yoni
[] Filter Refactoring:
    [] reconsider  id:{"!=":1} - it's not fun, maybe id$ne - not sure, maybe as another option
    [] consider creating a type for EntityFilter | ()=>(EntityFilter|Promise.EntityFilter)
    [] order of parameters in custom filter, entity metadata seems less important now.
    [] consider "" for sort ascending.
    [] where: { $and: [FamilyDeliveries.readyFilter()], id: f.deliveries.map(x => x.id) }


[] react metadata doesn't really work - and you need to specify the "valueType: Category"
[] the problem with ? and null and ! - imagine task has a Category property that is an entity - category? doesn't allow null - and undefined should be have ?
[] rethink entity inheritence - saving of child overwritten the saving of base
[] reconsider type FieldValidator - that hides lambda
[] check why realworld - allowApiInsert - the first param was any.
[] db migrations
[] should fieldType automatically serialize it's Fields?
[] apiRequireId = reconsider, maybe give more flexibility(filter orderid on orderdetails) etc...


[] ## Realworld
    [] real world angular - moving target, there is a full  new version of it - might worth forking from that
    [] use subscription like the original one does.
    [] real world - consider adding custom remult, that will have current user details?
    [] React - there is a new react typescript project - https://github.com/angelguzmaning/ts-redux-react-realworld-example-app




## context related:

## things that came up during react:











## V2
### questions about find with create
[] backend method - to expose some result that indicates progress.
[] should the new row created when not found enter the cache?
[] should cache empty results?
[] find with create and cache, and then find without create and with cache - should return the cache?
[] talk some more about value change, since in the current implementation, an update through click doesn't fire it
[] consider a column that is saved to more than one column in the db
[] consider adding the count value in the response of the array and do it in the response of iterate, to not break api
[] talk about forgetting the :type on fields - it's dangerous and can lead to debug issues - on the other hand we want some default - not sure if we should scream
[] consider the case where the name in restapi (json name) of a column is different from it's member - see commented test "json name is important"
[] switched back to es5 - since react scripts default is es5 and it breaks things
[] consider adding documentation properties to options, 'description', 'example value'

## remult angular future
[] change the getValue - to  displayValue
[] change the input type to support code+value, displayValueOnly
[] without knowing the types  - it doesn't use the display value or get value - see date without experimental meta data



*/


export interface EntityRef<entityType> {
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
}
export type Fields<entityType> = {
    [Properties in keyof entityType]: FieldRef<entityType, entityType[Properties]>
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>,
    [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>



}
export type FieldsMetadata<entityType> = {
    [Properties in keyof entityType]: FieldMetadata
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldMetadata,
    [Symbol.iterator]: () => IterableIterator<FieldMetadata>


}


export type SortSegments<entityType> = {
    [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}

export interface FieldRef<entityType = any, valueType = any> {
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
    getIdFilter(id: any): EntityFilter<entityType>;
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
    getDbName(): Promise<string>;
}
export interface Repository<entityType> {
    /**creates a json representation of the object */
    fromJson(x: any, isNew?: boolean): Promise<entityType>;
    metadata: EntityMetadata<entityType>;
    /** returns a result array based on the provided options */
    find(options?: FindOptions<entityType>): Promise<entityType[]>;
    iterate(options?: IterateOptions<entityType>): IterableResult<entityType>;
    findFirst(where?: EntityFilter<entityType>, options?: FindFirstOptions<entityType>): Promise<entityType>;
    findId(id: entityType extends { id: number } ? number : entityType extends { id: string } ? string : any, options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
    count(where?: EntityFilter<entityType>): Promise<number>;
    create(item?: Partial<entityType>): entityType;
    getEntityRef(item: entityType): EntityRef<entityType>;
    save(item: entityType): Promise<entityType>;
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
    [Properties in keyof entityType]?: "asc" | "desc"
}



export declare type EntityFilter<entityType> = {
    [Properties in keyof entityType]?:  (
        entityType[Properties] extends number | Date ? ComparisonValueFilter<entityType[Properties]> :
        entityType[Properties] extends string ? ContainsStringValueFilter & ComparisonValueFilter<string> :
        entityType[Properties] extends boolean ? ValueFilter<boolean> :
        ValueFilter<entityType[Properties]>) & ContainsStringValueFilter;
} |& {
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
export interface IterateOptions<entityType> extends FindOptionsBase<entityType> {
    pageSize?: number,
    progress?: { progress: (progress: number) => void };
}
export interface IterableResult<entityType> {
    toArray(options?: IterateToArrayOptions): Promise<entityType[]>;
    first(): Promise<entityType>;
    count(): Promise<number>;
    forEach(what: (item: entityType) => Promise<any>): Promise<number>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<entityType, entityType>>;
    };



}


