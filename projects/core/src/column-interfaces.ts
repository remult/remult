import {  Allowed } from './Context';
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
    inputType?: string;
    value?: valueType;
    storage?: ColumnStorage<valueType>;
    validate?: () => void | Promise<void>;
    valueChange?: () => void;
    
    dbName?: string | (() => string);
    serverExpression?: () => valueType | Promise<valueType>;
    dbReadOnly?: boolean;

    dataControlSettings?: () => DataControlSettings<any>;
}
export declare type ColumnOptions<valueType> = ColumnSettings<valueType> | string;




export interface DataControlSettings<entityType> {

    caption?: string;
    readonly?: boolean;
    inputType?: string;
    designMode?: boolean;
    getValue?: (row: entityType) => any;
    hideDataOnInput?: boolean;
    cssClass?: (string | ((row: entityType) => string));
    defaultValue?: (row: entityType) => any;
    onUserChangedValue?: (row: entityType) => void;
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
