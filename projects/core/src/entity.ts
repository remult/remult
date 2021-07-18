import { Allowed, Context, AllowedForInstance } from "./context";

import { FieldMetadata as FieldMetadata } from './column-interfaces';
import { EntityOrderBy, FieldsMetadata, FilterFactories, EntityWhere } from "./remult3";
import { CustomFilterBuilder, Filter } from "./filter/filter-interfaces";



export interface EntityOptions<entityType = any> {

  id?: (entity: FieldsMetadata<entityType>) => FieldMetadata;
  dbAutoIncrementId?: boolean;

  /**
 * A unique identifier that represents this entity, it'll also be used as the api route for this entity.
 */
  key: string;
  /**
   * The name of the table in the database that holds the data for this entity.
   * If no name is set, the `name` will be used instead.
   * @example
   * dbName = 'myProducts'
   * @example
   * dbName = () => 'select distinct name from Products`
   */
  dbName?: string | ((entity: FieldsMetadata<entityType>, context: Context) => string);
  /**A human readable name for the entity */
  caption?: string | ((context: Context) => string);
  includeInApi?: boolean;
  /**
   * Determines if this Entity is available for get requests using Rest Api 
   * @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiRead?: Allowed;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiUpdate?: AllowedForInstance<entityType>;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiDelete?: AllowedForInstance<entityType>;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiInsert?: AllowedForInstance<entityType>;
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed;

  /** A filter that determines which rows can be queries using the api.
   * @example
   * apiDataFilter: () => {
   *   if (!context.authenticated())
   *      return this.availableTo.isGreaterOrEqualTo(new Date());
   *   }
  */
  apiDataFilter?: ((entityType: FilterFactories<entityType>, context: Context) => (Filter | Filter[]));
  apiRequireId?: Allowed;
  /** A filter that will be used for all queries from this entity both from the API and from within the server.
   * @example
   * fixedWhereFilter: () => this.archive.isEqualTo(false)
   */
  fixedFilter?: EntityWhere<entityType>;
  customFilterBuilder?: CustomFilterBuilder<entityType, any>,
  /** An order by to be used, in case no order by was specified
   * @example
   * defaultOrderBy: () => this.name
   * 
   * @example
   * defaultOrderBy: () => [this.price, this.name]
   * 
   * @example
   * defaultOrderBy: () => [{ column: this.price, descending: true }, this.name]
   */
  defaultOrderBy?: EntityOrderBy<entityType>,
  /** An event that will be fired before the Entity will be saved to the database.
  * If the `validationError` property of the entity or any of it's columns will be set, the save will be aborted and an exception will be thrown.
  * this is the place to run logic that we want to run in any case before an entity is saved. 
  * @example
  * saving: async () => {
  *   if (context.onServer) {
  *     if (this.isNew()) {
  *         this.createDate.value = new Date();
  *     }
  *   }
  * }
  */
  saving?: (row: entityType, proceedWithoutSavingToDb: () => void) => Promise<any> | any;
  /** will be called after the Entity was saved to the data source. */
  saved?: (row: entityType) => Promise<any> | any
  /** Will be called before an Entity is deleted. */
  deleting?: (row: entityType) => Promise<any> | any
  /** Will be called after an Entity is deleted */
  deleted?: (row: entityType) => Promise<any> | any

  validation?: (e: entityType) => Promise<any> | any;
  customFilterTranslator?: CustomFilterBuilder<entityType, any>
}

