import { Allowed } from './context';
import { Column } from './column';
import { isFunction, isString } from 'util';
import { Entity } from './entity';
import { ValueListColumn } from './columns/value-list-column';




export interface ColumnStorage<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}



export interface ColumnSettings<valueType = any> {
    key?: string;
    includeInApi?: Allowed;
    allowApiUpdate?: Allowed;
    caption?: string;
    defaultValue?: ValueOrExpression<valueType>;
    validate?: ColumnValidator<valueType> | ColumnValidator<valueType>[];
    valueChange?: () => void;
    inputType?: string;
    dbName?: string;
    sqlExpression?: ValueOrExpression<string>;
    serverExpression?: () => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    allowNull?: boolean;

}
export declare type ColumnValidator<valueType = any> = (col: Column<valueType>) => void | Promise<void>;
export declare type ColumnOptions<valueType = any> = ColumnSettings<valueType> | string;
export declare type ValueOrExpression<valueType> = valueType | (() => valueType);
export declare type ValueOrEntityExpression<valueType, entityType extends Entity> = valueType | ((e: entityType) => valueType);
export function getColumnSettings<valueType>(options: ColumnOptions<valueType>): ColumnSettings<valueType> {
    if (options === undefined)
        return undefined;
    if (isString(options))
        return { caption: options };
    return options;
}
export function valueOrExpressionToValue<T>(f: ValueOrExpression<T>): T {
    if (isFunction(f)) {
        let x = f as any;
        return x();
    }
    return <T>f;
}
export function valueOrEntityExpressionToValue<T, entityType extends Entity>(f: ValueOrEntityExpression<T, entityType>, e: entityType): T {
    if (isFunction(f)) {
        let x = f as any;
        return x(e);
    }
    return <T>f;
}


export type DataControlInfo<rowType extends Entity = Entity> = DataControlSettings<rowType> | Column;
export interface DataControlSettings<entityType extends Entity = Entity> {

    column?: Column;
    getValue?: (row: entityType) => any;
    readOnly?: ValueOrEntityExpression<boolean, entityType>;
    cssClass?: (string | ((row: entityType) => string));

    caption?: string;
    visible?: (row: entityType) => boolean;

    click?: (row: entityType) => void;
    allowClick?: (row: entityType) => boolean;
    clickIcon?: string;

    valueList?: ValueListItem[] | string[] | any[] | Promise<ValueListItem[]> | (() => Promise<ValueListItem[]>);
    inputType?: string; //used: password,date,tel,text,checkbox,number
    hideDataOnInput?: boolean;//consider also setting the width of the data on input - for datas with long input
    forceEqualFilter?: boolean;

    width?: string;
}


export interface displayOptions<entityType> {
    readOnlyValue(getValue?: (row: entityType) => any);
    password();
    date();
    digits();
    checkbox();
    //dropDown(options: DropDownOptions);
    text(click?: clickable<entityType>);

}
export interface clickable<entityType> {
    click?: (row: entityType) => void;
    allowClick?: (row: entityType) => boolean;
    clickIcon?: string;
}



export interface ValueListItem {
    id?: any;
    caption?: any;
}

export function extend<T extends Column>(col: T): {
    dataControl(set: (settings: DataControlSettings) => void): T;
} {
    return {
        dataControl: (set) => {
            let configureDataControl: (settings: DataControlSettings) => void = col[configDataControlField];
            if (configureDataControl) {
                var existing = configureDataControl;
                configureDataControl = z => {
                    existing(z);
                    set(z);
                }
            }
            else
                configureDataControl = set;
            col[configDataControlField] = configureDataControl;
            return col;
        }
    }
}




export const configDataControlField = Symbol('configDataControlField');
