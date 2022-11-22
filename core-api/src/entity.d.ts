import { Allowed, AllowedForInstance } from "./context";
import { FieldMetadata as FieldMetadata } from './column-interfaces';
import { EntityOrderBy, FieldsMetadata, EntityFilter, EntityRef } from "./remult3";
export interface EntityOptions<entityType = any> {
    /**A human readable name for the entity */
    caption?: string;
    /**
     * Determines if this Entity is available for get requests using Rest Api
     * @see [allowed](http://remult.dev/docs/allowed.html)*/
    allowApiRead?: Allowed;
    /**
     * Determines if this entity can be updated through the api.
     * @see [allowed](http://remult.dev/docs/allowed.html)*/
    allowApiUpdate?: AllowedForInstance<entityType>;
    /** Determines if entries for this entity can be deleted through the api.
     * @see [allowed](http://remult.dev/docs/allowed.html)*/
    allowApiDelete?: AllowedForInstance<entityType>;
    /** Determines if new entries for this entity can be posted through the api.
     * @see [allowed](http://remult.dev/docs/allowed.html)*/
    allowApiInsert?: AllowedForInstance<entityType>;
    /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
    allowApiCrud?: Allowed;
    /** A filter that determines which rows can be queries using the api.
    * @example
    * apiPrefilter: { archive:false }
    *
    * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
    */
    apiPrefilter?: EntityFilter<entityType> | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>);
    /** A filter that will be used for all queries from this entity both from the API and from within the backend.
     * @example
     * backendPrefilter: { archive:false }
     * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
     */
    backendPrefilter?: EntityFilter<entityType> | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>);
    /** An order by to be used, in case no order by was specified
     * @example
     * defaultOrderBy: { name: "asc" }
     *
     * @example
     * defaultOrderBy: { price: "desc", name: "asc" }
     */
    defaultOrderBy?: EntityOrderBy<entityType>;
    /** An event that will be fired before the Entity will be saved to the database.
    * If the `error` property of the entity's ref or any of its fields will be set, the save will be aborted and an exception will be thrown.
    * this is the place to run logic that we want to run in any case before an entity is saved.
    * @example
    * @Entity<Task>("tasks", {
    * saving: async task => {
    *      task.lastUpdated = new Date()
    *  }
    *})
    */
    saving?: (row: entityType, proceedWithoutSavingToDb: () => void) => Promise<any> | any;
    /** will be called after the Entity was saved to the data source. */
    saved?: (row: entityType) => Promise<any> | any;
    /** Will be called before an Entity is deleted. */
    deleting?: (row: entityType) => Promise<any> | any;
    /** Will be called after an Entity is deleted */
    deleted?: (row: entityType) => Promise<any> | any;
    /** Will be called when the entity is being validated, usually prior to the `saving` event */
    validation?: (row: entityType, ref: EntityRef<entityType>) => Promise<any> | any;
    /** The name of the table in the database that holds the data for this entity.
   * If no name is set, the `key` will be used instead.
   * @example
   * dbName:'myProducts'
   */
    dbName?: string;
    /** For entities that are based on SQL expressions instead of a physical table or view*/
    sqlExpression?: string | ((entity: FieldsMetadata<entityType>) => string | Promise<string>);
    /** An arrow function that identifies the `id` column to use for this entity
     * @example
     * //Single column id
     * @Entity<Products>("products", { id:p=>p.productCode })
     * @example
     * //Multiple columns id
     * @Entity<OrderDetails>("orderDetails", { id:od=> [od.orderId, od.productCode] })
    */
    id?: (entity: FieldsMetadata<entityType>) => FieldMetadata | FieldMetadata[];
    entityRefInit?: (ref: EntityRef<entityType>, row: entityType) => void;
    apiRequireId?: Allowed;
}
