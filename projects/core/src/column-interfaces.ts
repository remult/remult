import { ClassType } from '../classType';
import { Allowed, Context, AllowedForInstance } from './context';
import {   EntityMetadata, FieldRef } from './remult3';








export interface FieldOptions<valueType = any, entityType = any> {
    key?: string;
    target?: ClassType<entityType>;
    dataType?: any;


    caption?: string | ((context: Context) => string);
    displayValue?: (entity: entityType, value: valueType) => string;
    defaultValue?: (entity: entityType, context: Context) => valueType | Promise<valueType>;
    validate?: FieldValidator<valueType, entityType> | FieldValidator<valueType, entityType>[];
    inputType?: string;
    allowNull?: boolean;

    dbName?: string;
    sqlExpression?: string | ((entity: EntityMetadata<entityType>, context: Context) => string);
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    valueConverter?: ValueConverter<valueType>;

    includeInApi?: Allowed;
    allowApiUpdate?: AllowedForInstance<entityType>;
}
export interface FieldMetadata<T = any> {
    readonly key: string;
    readonly target: ClassType<T>;
    readonly dataType: any;

    readonly caption: string;
    readonly inputType: string;
    readonly allowNull: boolean;


    readonly isServerExpression: boolean;
    readonly dbReadOnly: boolean;
    readonly dbName: string;
    readonly valueConverter: ValueConverter<T>;
    readonly options: FieldOptions;

}
export interface ValueConverter<T> {
    fromJson?(val: any): T;
    toJson?(val: T): any;
    fromDb?(val: any): T
    toDb?(val: T): any;
    toInput?(val: T, inputType: string): string;
    fromInput?(val: string, inputType: string): T;
    displayValue?(val: T): string;
    readonly fieldTypeInDb?: string;
    readonly inputType?: string;


}

export declare type FieldValidator<valueType = any, entityType = any> = (entity: entityType, col: FieldRef<valueType, entityType>) => void | Promise<void>;

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


