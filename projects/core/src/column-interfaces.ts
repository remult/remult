import { Allowed } from './context';
import { Column } from './column';

import { column, columnDefsOf } from './remult3';




export interface dbLoader<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}
export interface jsonLoader<valueType> {
    toJson(val: valueType): any;
    fromJson(val: any): valueType;
}
export interface inputLoader<valueType> {
    toInput(val: valueType): string;
    fromInput(val: string): valueType;
}



export interface ColumnSettings<valueType = any, entityType = any> {
    key?: string;
    includeInApi?: Allowed;
    allowApiUpdate?: Allowed;
    caption?: string;
    defaultValue?: (entity: entityType) => valueType | Promise<valueType>;
    validate?: ColumnValidator<valueType, entityType> | ColumnValidator<valueType, entityType>[];
    valueChange?: () => void;
    inputType?: string;
    dbName?: string;
    sqlExpression?: string | ((entity: columnDefsOf<entityType>) => string);
    serverExpression?: (entity: entityType) => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    allowNull?: boolean;
    displayValue?: (value: valueType, entity: entityType) => string;
    type?: any;
    dbLoader?: dbLoader<valueType>;
    jsonLoader?: jsonLoader<valueType>;
    inputLoader?: inputLoader<valueType>;
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
    readonly inputLoader: inputLoader<T>;
    readonly type: any;
    readonly allowNull: boolean;
    readonly dbType?: string;
}
export declare type delmeColumnValidatorHelper<T, ET> = (col: Column<T>, validate: ColumnValidator<T, ET>) => Promise<void>;
export declare type ColumnValidator<valueType = any, entityType = any> = (col: column<valueType, entityType>, entity: entityType) => void | Promise<void>;

export declare type ValueOrExpression<valueType> = valueType | (() => valueType);


export function valueOrExpressionToValue<T>(f: ValueOrExpression<T>): T {
    if (typeof f === 'function') {
        let x = f as any;
        return x();
    }
    return <T>f;
}







export interface ValueListItem {
    id?: any;
    caption?: any;
}


