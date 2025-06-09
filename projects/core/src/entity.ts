import type { Allowed, AllowedForInstance } from './context.js'

import type { FieldMetadata } from './column-interfaces.js'
import type {
  EntityFilter,
  EntityIdFields,
  EntityMetadata,
  EntityOrderBy,
  EntityRef,
  FieldsMetadata,
  FindOptions,
  LifecycleEvent,
  MembersOnly,
} from './remult3/remult3.js'
import type { FilterPreciseValues } from './filter/filter-interfaces.js'
import type { DataProvider } from './data-interfaces.js'

export interface EntityOptions<entityType = unknown> {
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
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiUpdate?: AllowedForInstance<entityType>
  /** Determines if entries for this entity can be deleted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiDelete?: AllowedForInstance<entityType>
  /** Determines if new entries for this entity can be posted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiInsert?: AllowedForInstance<entityType>
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed

  /**
   * An optional filter that determines which rows can be queried using the API.
   * This filter is applied to all CRUD operations to ensure that only authorized data is accessible.
   *
   * Use `apiPrefilter` to restrict data based on user profile or other conditions.
   *
   * @example
   * // Only include non-archived items in API responses
   * apiPrefilter: { archive: false }
   *
   * @example
   * // Allow admins to access all rows, but restrict non-admins to non-archived items
   * apiPrefilter: () => remult.isAllowed("admin") ? {} : { archive: false }
   *
   * @see [EntityFilter](https://remult.dev/docs/access-control.html#filtering-accessible-rows)
   */
  apiPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)

  /**
   * An optional function that allows for preprocessing or modifying the EntityFilter for a specific entity type
   * before it is used in API CRUD operations. This function can be used to enforce additional access control
   * rules or adjust the filter based on the current context or specific request.
   *
   * @template entityType The type of the entity being filtered.
   * @param filter The initial EntityFilter for the entity type.
   * @param event Additional information and utilities for preprocessing the filter.
   * @returns The modified EntityFilter or a Promise that resolves to the modified EntityFilter.
   *
   * @example
   * ```typescript
   * @Entity<Task>("tasks", {
   *   apiPreprocessFilter: async (filter, { getPreciseValues }) => {
   *     // Ensure that users can only query tasks for specific customers
   *     const preciseValues = await getPreciseValues();
   *     if (!preciseValues.customerId) {
   *       throw new ForbiddenError("You must specify a valid customerId filter");
   *     }
   *     return filter;
   *   }
   * })
   * ```
   */
  apiPreprocessFilter?: (
    filter: EntityFilter<entityType>,
    event: PreprocessFilterEvent<entityType>,
  ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>

  /**
   * Similar to apiPreprocessFilter, but for backend operations.
   *
   * @template entityType The type of the entity being filtered.
   * @param filter The initial EntityFilter for the entity type.
   * @param event Additional information and utilities for preprocessing the filter.
   * @returns The modified EntityFilter or a Promise that resolves to the modified EntityFilter.
   */
  backendPreprocessFilter?: (
    filter: EntityFilter<entityType>,
    event: PreprocessFilterEvent<entityType>,
  ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>

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
  /** For entities that are based on SQL expressions instead of a physical table or view
   * @example
   * @Entity('people', {
   *   sqlExpression:`select id,name from employees
   *                  union all select id,name from contractors`,
   * })
   * export class Person {
   *   @Fields.string()
   *   id=''
   *   @Fields.string()
   *   name=''
   * }
   */
  sqlExpression?:
    | string
    | ((entity: EntityMetadata<entityType>) => string | Promise<string>)
  /** An arrow function that identifies the `id` column to use for this entity
   * @example
   * //Single column id
   * @Entity<Products>("products", { id: 'productCode' })
   * @example
   * //Multiple columns id
   * @Entity<OrderDetails>("orderDetails", { id:['orderId:', 'productCode'] })
   */
  id?:
    | keyof MembersOnly<entityType>
    | (keyof MembersOnly<entityType>)[]
    | EntityIdFields<entityType>
    | ((entity: FieldsMetadata<entityType>) => FieldMetadata | FieldMetadata[])

  entityRefInit?: (ref: EntityRef<entityType>, row: entityType) => void
  apiRequireId?: Allowed
  /**
   * A function that allows customizing the data provider for the entity.
   * @param defaultDataProvider The default data provider defined in the `remult` object.
   * @example
   * dataProvider: (dp) => {
   *   if (!dp.isProxy) // usually indicates that we're on the backend
   *     return getASpacificDataProvider();
   *   return null
   * }
   * @returns A custom data provider for the entity.
   */
  dataProvider?: (
    defaultDataProvider: DataProvider,
  ) => DataProvider | Promise<DataProvider> | undefined | null

  /**
   * Prevents entity from being cached
   * @example
   * import { Entity, Fields, remult, repo, withRemult } from "remult";
   *
   * @Entity("positions", {
   *   // Disable repo caching for Position
   *   disableRepoCache: true,
   * })
   * class Position {
   *   @Fields.uuid()
   *   id!: string;
   *
   *   @Fields.number()
   *   x!: number;
   *
   *   @Fields.number()
   *   y!: number;
   *
   *   @Fields.number({
   *     async sqlExpression() {
   *       // Assuming you've declared queryVector in RemultContext
   *       const { x, y } = remult.context.queryVector || { x: 0, y: 0 };
   *       // This is obviously not safe, sanitize your user inputs to avoid sql injections
   *       return `SQRT(POWER(x - ${x}, 2) + POWER(y - ${y}, 2))`;
   *     },
   *   })
   *   distance?: number;
   * }
   *
   * await withRemult(
   *   async () => {
   *     // Thanks to `disableRepoCache: true`, sqlExpression from Position.distance will always be re-evaluated within the same remult async context
   *     remult.context.queryVector = { x: 20, y: 30 };
   *     const fromPoint = await repo(Position).find({
   *       orderBy: { distance: "asc" },
   *     });
   *
   *     remult.context.queryVector = { x: 0, y: 0 };
   *     const fromOrigin = await repo(Position).find({
   *       orderBy: { distance: "asc" },
   *     });
   *
   *     console.log(fromPoint, fromOrigin);
   *   }
   * );
   */
  disableRepoCache?: boolean
}

/**
 * Provides additional information and utilities for preprocessing filters in API and backend operations.
 * @template entityType The type of the entity being filtered.
 */
export interface PreprocessFilterEvent<entityType> {
  /**
   * Metadata of the entity being filtered.
   */
  metadata: EntityMetadata<entityType>

  /**
   * Retrieves precise values for each property in a filter for an entity.
   * @param filter Optional filter to analyze. If not provided, the current filter being preprocessed is used.
   * @returns A promise that resolves to a FilterPreciseValues object containing the precise values for each property.
   
  * @see {@Link FilterPreciseValues }
   */
  getFilterPreciseValues(
    filter?: EntityFilter<entityType>,
  ): Promise<FilterPreciseValues<entityType>>
}
