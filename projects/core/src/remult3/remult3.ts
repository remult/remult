
import { FieldMetadata } from "../column-interfaces";
import { IterateToArrayOptions, Unobserve } from "../context";
import { EntityOptions as EntityOptions } from "../entity";
import { Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { entityEventListener } from "../__EntityValueProvider";




/*
## Should work
[] when added DataControl decorator for category id - lost caption
[V] adapt value converter
[V] add display value to value converter
[V] remove readonly from columnDefs - and hijack it in Remult Angular
[V] make value list return a converter + benefits (Getoptions etc...)
[V] separate column and defs - defs will be property of column
[V] fix tests relevant to finding out the relationship between crud and specific apis,"allow api read depends also on api crud"
[V] "dbname of entity can use column names"
[V] test-paged-foreach
[V] fix validate to have the same parameter order as other things
[V] fix _items, to go away.
[V] "test make sort unique" - both tests
[V] fix allowApiUpdate for column to support additional info - so we can do only on new rows etc...
[V] "apiRequireId"
[V] return the test that was disabled by moving the server expression to remult 3- "get based on id virtual column async"
[V] consider sqlExpression where does it get the column name - see "test-sql-expression.spec.ts" line 41,47
[V] original data should reflect the values after server expressions
[V] replace method not allowed with forbidden - when something is not allowed
[V] add reflect metadata to dependencies
[V] prevent jobsInQueue to register as an api entity - it's not one
[V] think of id entity.
[V] rename `name` to `key` in Entity Settings
[V] replace entitydefs.name = key.
[V] rename allow api crud
[V] value converter no longer lambda
[V] caption - lambda
[V] storable to field Type
[V] value list field Type
[V] upgrade to angular 9 and ts 3.7

[V] column to field
[V] decimal field
[V] date only field

[V] remove get set from context
[V] remove server context from public
[V] change idfield to idMetadata and move logic in.
[V] move classType to it's own file and remove it from index.
[V] move set to it's own file
[V] move input types to it's own files.
[V] move url builder to it's own type
[V] move server function to server method.
[V] rename terminology from ServerMethod to BackendMethod
[V] rename onserver to backend
[V] change server function allowed to be entity allowed
[V] change entityallowed to InstanceAllowed.
[V] remove controller Allowed
[V] move utility functions to utilities. (get value or expression etc...)
[V] change controller to just recieve a key parameters



[] ?add tojson and from json to FieldDefinitions
[] support toJSON in entityBase
[V] support settings of entity values with plain JSON objects, and figuring out their id.
[V] setting value of entity with a plain id/string should work also.
[] dbAutoIncrementId for Array databases- int and string guid
[] add code that entity relation can be tested for null - and it'll not perform fetch.

[] instead of row, use entity
[V] test data control with number, make sure it updates on blur

[V] use helmet instead of force https
[V] fix timeout by using a repeat mechanism in context.
[X] test dateonly field decorator  on function parameter
[X] "bool column doesn't need contains, isin and is not in"




## TODO

[V] "test object column"
[V] review repository api - and consider moving stuff to defs
[V] fix extends to be smarter
[V] "order by api"
[X] test default value set in the pojo itself: a=0;
[X] completed = false; didn't serialize as false to json
[V] fix shit with running on server - it gets it wrong in too many cases (React etc...)
[V] make the entity error, include the message of any exception on save - and use it in the angular todo as the error.
[V] FieldOptions.Lazy
[V] add load to find and iterate, where you specify the columns you want loaded.
[] find id - add useCache second parameter.
[] FindOne and FindOrCreate should consider cache.
[] remove lookupid async and lookup async
[] add createIfNotFound?:boolean; to FindFirstOptions and delete FindOrCreate
[] eliminate lookup and get id by making find first cached - move lookup to remult angular
[] fix react remult demo to loose the load fields


## Server Controller
[V] rebuild validation model for ServerMethod

## closed list column
[V] "Closed List  column"
[V] "test value list type"
[V] value list "works with automatic id"
[V] revive value list column tests "get array works with filter in body","get array works with filter in body and in array statement","get array works with filter in body and or statement"
[V]"getArray works with filter and in with closed list columns"
[V]"getArray works with filter and multiple values with closed list columns"

## compound id column
[V] "compound id"
[V] reconsider the IdColumn member - might make sense to remove it
[] sql database, update of row where id is not named id is compromised

## review with Yoni

[] "negative decimal" - inputValue
[] "Number is always a number"
    [] "test number is always number"
    [] test number is always a number - settings value with any string, and then doing math options for it.
[] consider the setting decimal digits, instead might be useful to determine db storage - replaced with db type
[V] validationError is now called error
[] the inconsistenacy beyween Date and DateTime - in our naming and also with input management

[] consider DbAutoIncrement to decorator
[] reconsider idColumn - maybe internalize it.
[V] rowHelper naming
[] reconsider Item and Entity.
[V] ColumnDefinitions vs ColumnOptions and same for entity
[] apiDataFilter
[] fixedFilter
[] consider a column that is saved to more than one column in the db
[] included display value and input type also in value converter - ias it is relevant to date only, and also value list
[] i make errors with the order of the generic parameters, entity, column and vice versa
[V] reconsider all the where stuff - just searh references for AndFilter to see the problem
[] make where awaitable
[] reconsider the custom filter with the FD
[] talk about allow null for date, object types, etc...
[] when using a value list column - it generates an int column with allow null, and no options to set it as allow null false and default value for now on the create table script
[] consider adding the count value in the response of the array
[] talk about forgetting the :type on fields - it's dangerous and can lead to debug issues - on the other hand we want some default - not sure if we should scream
[] talk about familyDeliveries.$.courier.hasValue - to see if it was set without loading the row
[] talk about await Promise.all(existingFamilies.map(f => f.$.distributionCenter.load())); that was needed before checking if the distribution center is allowed for the user
[] talk some more about value change, since in the current implementation, an update through click doesn't fire it
[] talk about typescript loosing types in a case of self reference - in this sample, the visible that references the grid - breaks the typing
```
 grid = new GridSettings(this.context.for(Products), {
    allowCrud: true,
    where:x=>x.name.contains("1"),
    gridButtons:[{
      name:'dosomething',
      visible:()=>this.grid.selectedRows.length>0
    }]
  });
```
[] talk about $.find('name') vs $['name']
[]c.defs.valueConverter !== DateOnlyValueConverter
[] rethink compoundid and idmetadata to encapsulate some of the ugliness of ids.


## context related:
[] entity allowed gets entity as second parameter, because allowed always get the context as first parameter
[] rename context to remult
[] with regards to the context init and setting the different things - maybe we should add an option to fail there and fail the request - for example in case the user info was updated since the last token was given and he has no rights any more etc...
[] consider the case when initing context, and cashing rows between requests, you might get a save to a context of a request two hours ago.
[] custom context 
[] consider the name FilterFactories to be EntityFilterFactories
[] add to entity options a lambda that gets context and returns data provider.
[] talk about isvalid that gives you indication of the data is valid etc....

[] consider an option of running it all in the browser, for the development start, just like weve done with the json database


## things that came up during react:
[V] reflect metadata doesn't work in react
[V] talk about moving the multiple articles function to articleModel file ,caused a server bug
[V] talk about duplicate value test, should happen only on server?
[x] talk about typing problem when using entity base - https://github.com/microsoft/TypeScript/issues/34933


[] rename get cached by id async to findfirst with a second parameter of disable cache.
[V] consider making all entity field, by default automatically loaded - and disable it if wanted - will be easier to understand
[V] talk about the entity field not loaded in allowApiUpdate that broke the code.


[] review weird typing issue with article payload action that failed for some reason

[] talk about invoking client side validation






## context stuff:
    * repository for
    * current user
        *  is signed in
        * is allowed
        * basic current user info
        * setuser
        * add listener to user
    * map (getter and setter of stuff)
    * onServer (let's you know you're on the server)
    * Info about request

## consider if needed

[] consider the case where the name in restapi (json name) of a column is different from it's member - see commented test "json name is important"
[] reconsider if setting a value, clears the error member - see test ""validation clears on change"", "get based on id virtual column"
[] consider the previous functionalty of being aware of the id column type of the entity, to allow a short id lookup
[] apiRequireId = reconsider, maybe give more flexibility(filter orderid on orderdetails) etc...

[] fails because author is undefined. allowApiDelete: (context, comment) => comment.author.username == context.user.id,

## remult angular
[V] fix grid filter helper when filtering on a datetime column - to filter between today and tomorrow
[V] fix grid filter on string to be contains if not force equals - and same for object
[V] "test column value change"
[V]"test filter works with user filter"
[V]"test filter works with selected rows"
[V]"test select rows in page is not select all"
[V] "column drop down"
[V] "column drop down with promise"
[V] "column drop down with promise"
[V] "sort is displayed right on start"
[V] "sort is displayed right"
[V] "column drop down 1"
[V] "works ok with filter"
[V] "uses a saparate column"
[V] redesign extend 
[V] fix ignore id in id Entity
[V] fix sort method on grid settings
[V] fix getColumnsFromObject and it's usages
[V] make sure that column will be readonly if allowApiUpdateIsFalse
[V] data area with local columns "get value function works"
    [V] "test consolidate"
    [V] "works without entity"
    [V] "get value function works"

## remult angular future
[] change the getValue - to  displayValue
[] change the input type to support code+value, displayValueOnly











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
}
export type Fields<entityType> = {
    [Properties in keyof entityType]: FieldRef<entityType[Properties], entityType>
} & {
    find(col: FieldMetadata): FieldRef<any, entityType>,
    [Symbol.iterator]: () => IterableIterator<FieldRef<any, entityType>>



}
export type FieldsMetadata<entityType> = {
    [Properties in keyof entityType]: FieldMetadata
} & {
    find(col: FieldMetadata): FieldMetadata,
    [Symbol.iterator]: () => IterableIterator<FieldMetadata>


}


export type SortSegments<entityType> = {
    [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}

export interface FieldRef<valueType, entityType = any> {
    inputType: string;
    error: string;
    displayValue: string;
    value: valueType;
    originalValue: valueType;
    inputValue: string;
    wasChanged(): boolean;
    entityRef: EntityRef<entityType>;
    container: entityType;
    metadata: FieldMetadata<entityType>;
    load(): Promise<valueType>;
}
export interface IdMetadata<entityType = any> {

    field: FieldMetadata<any>;
    getIdFilter(id: any): Filter;
    isIdField(col: FieldMetadata): boolean;
    createIdInFilter(items: entityType[]): Filter;

}

export interface EntityMetadata<entityType = any> {
    readonly idMetadata: IdMetadata<entityType>;
    readonly key: string,
    readonly dbName: string,
    readonly fields: FieldsMetadata<entityType>,
    readonly caption: string;
    readonly options: EntityOptions;
}
export interface Repository<entityType> {
    fromJson(x: any, isNew?: boolean): Promise<entityType>;

    metadata: EntityMetadata<entityType>;



    find(options?: FindOptions<entityType>): Promise<entityType[]>;
    iterate(options?: EntityWhere<entityType> | IterateOptions<entityType>): IterableResult<entityType>;
    count(where?: EntityWhere<entityType>): Promise<number>;
    findFirst(where?: EntityWhere<entityType> | FindFirstOptions<entityType>): Promise<entityType>;
    findId(id: any,options?:FindFirstOptionsBase<entityType>): Promise<entityType>;
    /*to remove*/getCachedByIdAsync(id: any): Promise<entityType>;

    /*to remove*/findOrCreate(options?: EntityWhere<entityType> | IterateOptions<entityType>): Promise<entityType>;
    /**
 * Used to get non critical values from the Entity.
* The first time this method is called, it'll return a new instance of the Entity.
* It'll them call the server to get the actual value and cache it.
* Once the value is back from the server, any following call to this method will return the cached row.
* 
* It was designed for displaying a value from a lookup table on the ui - counting on the fact that it'll be called multiple times and eventually return the correct value.
* 
* * Note that this method is not called with `await` since it doesn't wait for the value to be fetched from the server.
* @example
* return  context.for(Products).lookup(p=>p.id.isEqualTo(productId));
 */
    lookup(filter: EntityWhere<entityType>): entityType;

    /** returns a single row and caches the result for each future call
  * @example
  * let p = await this.context.for(Products).lookupAsync(p => p.id.isEqualTo(productId));
  */
    /*to remove*/lookupAsync(filter: EntityWhere<entityType>): Promise<entityType>;

    create(item?: Partial<entityType>): entityType;

    /*to remove*/getCachedById(id: any): entityType;
    /*internalize*/addToCache(item: entityType);


    getEntityRef(item: entityType): EntityRef<entityType>;
    save(item: entityType): Promise<entityType>;
    delete(item: entityType): Promise<void>;
    addEventListener(listener: entityEventListener<entityType>): Unobserve;
}
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {

    /** Determines the number of rows returned by the request, on the browser the default is 25 rows 
     * @example
     * this.products = await this.context.for(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    limit?: number;
    /** Determines the page number that will be used to extract the data 
     * @example
     * this.products = await this.context.for(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    page?: number;
    __customFindData?: any;

}
/** Determines the order of rows returned by the query.
 * @example
 * await this.context.for(Products).find({ orderBy: p => p.name })
 * @example
 * await this.context.for(Products).find({ orderBy: p => [p.price, p.name])
 * @example
 * await this.context.for(Products).find({ orderBy: p => [{ field: p.price, descending: true }, p.name])
 */
export declare type EntityOrderBy<entityType> = (entity: SortSegments<entityType>) => SortSegment[] | SortSegment;

/**Used to filter the desired result set
 * @example
 * where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
 */
export declare type EntityWhere<entityType> = ((entityType: FilterFactories<entityType>) => (Filter | Filter[] | EntityWhere<entityType>)) | EntityWhere<entityType>[];





export interface FilterFactory<valueType> {
    isEqualTo(val: valueType): Filter;
    isDifferentFrom(val: valueType);
    isIn(val: valueType[]): Filter;
    isNotIn(val: valueType[]): Filter;
}

export interface ComparisonFilterFactory<valueType> extends FilterFactory<valueType> {


    isLessOrEqualTo(val: valueType): Filter;
    isLessThan(val: valueType): Filter;
    isGreaterThan(val: valueType): Filter;
    isGreaterOrEqualTo(val: valueType): Filter;
}
export interface ContainsFilterFactory<valueType> extends FilterFactory<valueType> {
    contains(val: string): Filter;
}

export type FilterFactories<entityType> = {
    [Properties in keyof entityType]: entityType[Properties] extends number | Date ? ComparisonFilterFactory<entityType[Properties]> :
    entityType[Properties] extends string ? (ContainsFilterFactory<entityType[Properties]> & ComparisonFilterFactory<entityType[Properties]>) :
    ContainsFilterFactory<entityType[Properties]>
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
    where?: EntityWhere<entityType>;
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
    progress?: { progress: (progress: number) => void };
}
export interface IterableResult<T> {
    toArray(options?: IterateToArrayOptions): Promise<T[]>;
    first(): Promise<T>;
    count(): Promise<number>;
    forEach(what: (item: T) => Promise<any>): Promise<number>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<T>>;
    };
}

