import { Allowed, Remult, AllowedForInstance } from "./context";

import { FieldMetadata as FieldMetadata } from './column-interfaces';
import { EntityOrderBy, FieldsMetadata, FilterFactories, EntityFilter } from "./remult3";




export interface EntityOptions<entityType = any> {

  id?: (entity: FieldsMetadata<entityType>) => FieldMetadata;
  dbAutoIncrementId?: boolean;

  /**
   * The name of the table in the database that holds the data for this entity.
   * If no name is set, the `key` will be used instead.
   * @example
   * dbName:'myProducts'
   */
  dbName?: string;
  sqlExpression?: string | ((entity: FieldsMetadata<entityType>) => string | Promise<string>);
  /**A human readable name for the entity */
  caption?: string;
  /**
   * Determines if this Entity is available for get requests using Rest Api 
   * @see [allowed](http://remult.github.io/guide/allowed.html)*/
  allowApiRead?: Allowed;

  /** 
   * Determines if this entity can be updated through the api.
   * @see [allowed](http://remult.github.io/guide/allowed.html)*/
  allowApiUpdate?: AllowedForInstance<entityType>;
  /** @see [allowed](http://remult.github.io/guide/allowed.html)*/
  allowApiDelete?: AllowedForInstance<entityType>;
  /** @see [allowed](http://remult.github.io/guide/allowed.html)*/
  allowApiInsert?: AllowedForInstance<entityType>;
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed;

  /** A filter that determines which rows can be queries using the api.

  */
  apiPrefilter?: EntityFilter<entityType>;
  apiRequireId?: Allowed;
  /** A filter that will be used for all queries from this entity both from the API and from within the server.
   * @example
   * fixedWhereFilter: () => this.archive.isEqualTo(false)
   */
  backendPrefilter?: EntityFilter<entityType>;
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
  * saving: async (self) => {
  *   if (isBackend()) {
  *     if (self.isNew()) {
  *         self.createDate.value = new Date();
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

}

