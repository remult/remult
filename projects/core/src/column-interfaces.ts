import { Allowed } from './Context';
import { Column } from './column';
import { DropDownSource } from './drop-down-source';



export interface ColumnStorage<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}



export interface ColumnSettings<valueType> {
    jsonName?: string;
    includeInApi?: Allowed;
    caption?: string;
    allowApiUpdate?: Allowed;
    defaultValue?: ValueOrFunction<valueType>;//consider if it should always be a lambda to avoid errors
    storage?: ColumnStorage<valueType>;
    validate?: () => void | Promise<void>;
    valueChange?: () => void;

    dbName?: ValueOrFunction<string>;
    serverExpression?: () => valueType | Promise<valueType>;
    dbReadOnly?: boolean;

    dataControlSettings?: () => DataControlSettings<any>;
}
export declare type ColumnOptions<valueType> = ColumnSettings<valueType> | string;
export declare type ValueOrFunction<valueType> = valueType | (() => valueType);




export interface DataControlSettings<entityType> {

    caption?: string;
    readonly?: boolean;
    inputType?: string; //used: password,date,phone,text,checkbox,number
    designMode?: boolean;
    getValue?: (row: entityType) => any;
    hideDataOnInput?: boolean;//consider also setting the width of the data on input - for datas with long input
    cssClass?: (string | ((row: entityType) => string));
    defaultValue?: (row: entityType) => any;
    userChangedValue?: (row: entityType) => void;
    click?: (row: entityType) => void;
    allowClick?: (row: entityType) => boolean;
    clickIcon?: string;
    dropDown?: DropDownOptions;
    column?: Column<any>;
    width?: string;
}


export interface DropDownOptions {

    items?: DropDownItem[] | string[] | any[];
    source?: DropDownSource<any>;
}


export interface DropDownItem {
    id?: any;
    caption?: any;
}
export interface FilteredColumnSetting<rowType> extends DataControlSettings<rowType> {
    _showFilter?: boolean;
}



export interface RowEvents {
    rowDeleted?: () => void;
    rowSaved?: (newRow: boolean) => void;
    rowReset?: (newRow: boolean) => void;
}
