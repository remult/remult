import { Allowed } from './context';
import { Column } from './column';

import { Entity } from './entity';

import { column } from './remult3';




export interface dbLoader<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}
export interface jsonLoader<valueType> {
    toJson(val: valueType): any;
    fromJson(val: any): valueType;
}



export interface ColumnSettings<valueType = any, entityType = any> {
    key?: string;
    includeInApi?: Allowed;
    allowApiUpdate?: Allowed;
    caption?: string;
    defaultValue?: ValueOrExpression<valueType>;
    validate?: ColumnValidator<valueType, entityType> | ColumnValidator<valueType, entityType>[];
    valueChange?: () => void;
    inputType?: string;
    dbName?: string;
    sqlExpression?: ValueOrExpression<string>;
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    allowNull?: boolean;
    displayValue?: (value:valueType,entity:entityType) => string;
    type?: any;
    dbLoader?: dbLoader<valueType>;
    jsonLoader?: jsonLoader<valueType>;
    dbType?: string;

}
export interface columnDefs<T = any> {
    readonly dbReadOnly: boolean;
    readonly isVirtual: boolean;
    readonly key: string;
    readonly caption: string;
    readonly inputType: string;
    readonly dbName: string;
    readonly dbLoader: dbLoader<T>;
    readonly jsonLoader: jsonLoader<T>;
    readonly type: any;
    readonly dbType?: string;
}
export declare type delmeColumnValidatorHelper<T, ET> = (col: Column<T>, validate: ColumnValidator<T, ET>) => Promise<void>;
export declare type ColumnValidator<valueType = any, entityType = any> = (col: column<valueType, entityType>, entity: entityType) => void | Promise<void>;

export declare type ValueOrExpression<valueType> = valueType | (() => valueType);
export declare type ValueOrEntityExpression<valueType, entityType> = valueType | ((e: entityType) => valueType);

export function valueOrExpressionToValue<T>(f: ValueOrExpression<T>): T {
    if (typeof f === 'function') {
        let x = f as any;
        return x();
    }
    return <T>f;
}
export function valueOrEntityExpressionToValue<T, entityType extends Entity>(f: ValueOrEntityExpression<T, entityType>, e: entityType): T {
    if (typeof f === 'function') {
        let x = f as any;
        return x(e);
    }
    return <T>f;
}







export interface ValueListItem {
    id?: any;
    caption?: any;
}


