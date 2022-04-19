import { ClassType } from '../classType';
import { Allowed, Remult, AllowedForInstance } from './context';
import { EntityMetadata, FieldRef } from './remult3';








export interface FieldOptions<entityType = any, valueType = any> {
    /**A human readable name for the field */
    caption?: string;
    /** If it can store null in the database */
    allowNull?: boolean;
    /** If this field data is included in the api.
     * @see [allowed](http://remult.dev/docs/allowed.html)*/
    includeInApi?: Allowed;
    /** If this field data can be updated in the api.
    * @see [allowed](http://remult.dev/docs/allowed.html)*/

    allowApiUpdate?: AllowedForInstance<entityType>;

    /** An arrow function that'll be used to perform validations on it
     * @example
     * .@Fields.string({
     *   validate: Validators.required
     * })
     * @example
     * .@Fields.string<Task>({
     *    validate: task=>{
     *      if (task.title.length<3)
     *          throw "Too Short";
     *   }
     * })
     * @example
     * .@Fields.string({
     *    validate: (_, fieldRef)=>{
     *      if (fieldRef.value.length<3)
     *          fieldRef.error = "Too Short";
     *   }
     * })
     */
    validate?: ((entity: entityType, col: FieldRef<entityType, valueType>) => (any | Promise<any>)) | ((entity: entityType, col: FieldRef<entityType, valueType>) => (any | Promise<any>))[];

    /** Will be fired before this field is saved to the server/database */
    saving?: ((entity: entityType, col: FieldRef<entityType, valueType>) => (any | Promise<any>));
    /**  An expression that will determine this fields value on the backend and be provided to the front end*/
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    /** The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead. */
    dbName?: string;
    /** Used or fields that are based on an sql expressions, instead of a physical table column */
    sqlExpression?: string | ((entity: EntityMetadata<entityType>) => string | Promise<string>);
    /** For fields that shouldn't be part of an update or insert statement */
    dbReadOnly?: boolean;
    /** The value converter to be used when loading and saving this field */
    valueConverter?: ValueConverter<valueType>;


    /** an arrow function that translates the value to a display value */
    displayValue?: (entity: entityType, value: valueType) => string;
    /** an arrow function that determines the default value of the field, when the entity is created using the `repo.create` method */
    defaultValue?: (entity: entityType) => valueType | Promise<valueType>;

    /** The html input type for this field */
    inputType?: string;
    /** Determines if the referenced entity will be loaded immediately or on demand.
     * @see[Lazy loading of related entities](http://remult.dev/docs/lazy-loading-of-related-entities.html)
     */
    lazy?: boolean;
    /** The value type for this field */
    valueType?: any;
    /** The entity type to which this field belongs */
    target?: ClassType<entityType>;//confusing it'll sometime reference an entity/controller and sometype the datatype iteslf
    /** The key to be used for this field */
    key?: string;
}
export interface FieldMetadata<valueType = any> {
    readonly key: string;
    readonly target: ClassType<valueType>;
    readonly valueType: any;

    readonly caption: string;
    readonly inputType: string;
    readonly allowNull: boolean;
    getDbName(): Promise<string>;

    readonly isServerExpression: boolean;
    readonly dbReadOnly: boolean;
    readonly valueConverter: ValueConverter<valueType>;
    readonly options: FieldOptions;

}
export interface ValueConverter<valueType> {
    fromJson?(val: any): valueType;
    toJson?(val: valueType): any;
    fromDb?(val: any): valueType
    toDb?(val: valueType): any;
    toInput?(val: valueType, inputType: string): string;
    fromInput?(val: string, inputType: string): valueType;
    displayValue?(val: valueType): string;
    readonly fieldTypeInDb?: string;
    readonly inputType?: string;


}

export declare type FieldValidator<entityType = any, valueType = any> = (entity: entityType, col: FieldRef<entityType, valueType>) => void | Promise<void>;

export declare type ValueOrExpression<valueType> = valueType | (() => valueType);


export function valueOrExpressionToValue<valueType>(f: ValueOrExpression<valueType>): valueType {
    if (typeof f === 'function') {
        let x = f as any;
        return x();
    }
    return <valueType>f;
}







export interface ValueListItem {
    id?: any;
    caption?: any;
}


