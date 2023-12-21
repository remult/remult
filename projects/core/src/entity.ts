import type { Allowed, AllowedForInstance } from './context.js'

import type { FieldMetadata } from './column-interfaces.js'
import type {
  EntityFilter,
  EntityIdFields,
  EntityMetadata,
  EntityOrderBy,
  EntityRef,
  FieldsMetadata,
  LifecycleEvent,
} from './remult3/remult3.js'

export interface EntityOptions<entityType = any> {
  /**A human readable name for the entity */
  caption?: string

  /**
   * Determines if this Entity is available for get requests using Rest Api
   * @description
   * Determines if one has any access to the data of an entity.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see to restrict data based on a criteria, use [apiPrefilter](https://remult.dev/docs/ref_entity.html#apiprefilter)
   * */
  allowApiRead?: Allowed

  /**
   * Determines if this entity can be updated through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiUpdate?: AllowedForInstance<entityType>
  /** Determines if entries for this entity can be deleted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiDelete?: AllowedForInstance<entityType>
  /** Determines if new entries for this entity can be posted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiInsert?: AllowedForInstance<entityType>
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed

  /** A filter that determines which rows can be queries using the api.
   * @description
   * Use apiPrefilter in cases where you to restrict data based on user profile
   * @example
   * apiPrefilter: { archive:false }
   *
   * @example
   * apiPrefilter: ()=> remult.isAllowed("admin")?{}:{ archive:false }
   * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
   *
   */
  apiPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)

  /** A filter that will be used for all queries from this entity both from the API and from within the backend.
   * @example
   * backendPrefilter: { archive:false }
   * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
   */
  backendPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)
  /** An order by to be used, in case no order by was specified
   * @example
   * defaultOrderBy: { name: "asc" }
   *
   * @example
   * defaultOrderBy: { price: "desc", name: "asc" }
   */
  defaultOrderBy?: EntityOrderBy<entityType>
  /** An event that will be fired before the Entity will be saved to the database.
   * If the `error` property of the entity's ref or any of its fields will be set, the save will be aborted and an exception will be thrown.
   * this is the place to run logic that we want to run in any case before an entity is saved.
   * @example
   * @Entity<Task>("tasks", {
   *   saving: async (task, e) => {
   *     if (e.isNew) {
   *       task.createdAt = new Date(); // Set the creation date for new tasks.
   *     }
   *     task.lastUpdated = new Date(); // Update the last updated date.
   *   },
   * })
   * @param entity - The instance of the entity being saved.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  saving?: (
    entity: entityType,
    event: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs after an entity has been successfully saved.
   *
   * @param entity The instance of the entity that was saved.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  saved?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs before an entity is deleted.
   *
   * @param entity The instance of the entity being deleted.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  deleting?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs after an entity has been successfully deleted.
   *
   * @param entity The instance of the entity that was deleted.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  deleted?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs to perform validation checks on an entity before saving.
   * This hook is also executed on the frontend.
   *
   * @param entity The instance of the entity being validated.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  validation?: (
    entity: entityType,
    ref: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /** The name of the table in the database that holds the data for this entity.
   * If no name is set, the `key` will be used instead.
   * @example
   * dbName:'myProducts'
   *
   * You can also add your schema name to the table name
   * @example
   * dbName:'public."myProducts"'
   */
  dbName?: string
  /** For entities that are based on SQL expressions instead of a physical table or view*/
  sqlExpression?:
    | string
    | ((entity: EntityMetadata<entityType>) => string | Promise<string>)
  /** An arrow function that identifies the `id` column to use for this entity
   * @example
   * //Single column id
   * @Entity<Products>("products", { id: {productCode: true} })
   * @example
   * //Multiple columns id
   * @Entity<OrderDetails>("orderDetails", { id:{ orderId:true, productCode:true} })
   */
  id?:
    | EntityIdFields<entityType>
    | ((entity: FieldsMetadata<entityType>) => FieldMetadata | FieldMetadata[])
  entityRefInit?: (ref: EntityRef<entityType>, row: entityType) => void
  apiRequireId?: Allowed
}
