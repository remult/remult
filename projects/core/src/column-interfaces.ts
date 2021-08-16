import { ClassType } from '../classType';
import { Allowed, Context, AllowedForInstance } from './context';
import { EntityMetadata, FieldRef } from './remult3';








export interface FieldOptions<entityType = any, valueType = any> {
    key?: string;
    target?: ClassType<entityType>;//confusing it'll sometime reference an entity/controller and sometype the datatype iteslf
    valueType?: any;


    caption?: string ;
    displayValue?: (entity: entityType, value: valueType) => string;
    defaultValue?: (entity: entityType) => valueType | Promise<valueType>;
    validate?: FieldValidator<entityType, valueType> | FieldValidator<entityType, valueType>[];
    inputType?: string;
    allowNull?: boolean;

    dbName?: string;
    sqlExpression?: string | ((entity: EntityMetadata<entityType>) => string | Promise<string>);
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    valueConverter?: ValueConverter<valueType>;

    includeInApi?: Allowed;
    allowApiUpdate?: AllowedForInstance<entityType>;
    lazy?: boolean;
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


