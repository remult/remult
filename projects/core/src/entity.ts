import {  Allowed, EntityAllowed } from "./context";

import { columnDefs } from './column-interfaces';
import {  EntityOrderBy, EntityWhereItem, NewEntity,  columnDefsOf } from "./remult3";



export interface EntityOptions<T = any> {

  id?: (entity: columnDefsOf<T>) => columnDefs,
  extends?: NewEntity<any>;
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
  dbName?: string | ((entity: columnDefsOf<T>) => string);
  /**A human readable name for the entity */
  caption?: string;
  /**
   * Determines if this Entity is available for get requests using Rest Api 
   * @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiRead?: Allowed;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiUpdate?: EntityAllowed<T>;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiDelete?: EntityAllowed<T>;
  /** @see [allowed](http://remult-ts.github.io/guide/allowed.html)*/
  allowApiInsert?: EntityAllowed<T>;
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed;

  /** A filter that determines which rows can be queries using the api.
   * @example
   * apiDataFilter: () => {
   *   if (!context.isSignedIn())
   *      return this.availableTo.isGreaterOrEqualTo(new Date());
   *   }
  */
  apiDataFilter?: EntityWhereItem<T>;
  apiRequireId?: Allowed;
  /** A filter that will be used for all queries from this entity both from the API and from within the server.
   * @example
   * fixedWhereFilter: () => this.archive.isEqualTo(false)
   */
  fixedWhereFilter?: EntityWhereItem<T>;
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
  defaultOrderBy?: EntityOrderBy<T>,
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
  saving?: (row: T, proceedWithoutSavingToDb: () => void) => Promise<any> | any;
  /** will be called after the Entity was saved to the data source. */
  saved?: (row: T) => Promise<any> | any
  /** Will be called before an Entity is deleted. */
  deleting?: (row: T) => Promise<any> | any
  /** Will be called after an Entity is deleted */
  deleted?: (row: T) => Promise<any> | any

  validation?: (e: T) => Promise<any> | any;

  dbAutoIncrementId?: boolean;
}

