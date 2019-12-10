import {  Allowed } from '../context/Context';
import { Column } from './column';
import { DropDownSource } from './drop-down-source';



export interface ColumnStorage<dataType> {
    toDb(val: dataType): any;
    fromDb(val: any): dataType;
}
export interface ColumnValueProvider {
    getValue(key: string): any;
    getOriginalValue(key: string): any;
    setValue(key: string, value: any): void;
}



export interface DataColumnSettings<type> {
    jsonName?: string;
    includeInApi?: Allowed;
    caption?: string;
    allowApiUpdate?: Allowed;
    inputType?: string;
    dbName?: string | (() => string);
    value?: type;
    storage?: ColumnStorage<type>;
    onValidate?: () => void | Promise<void>;
    getValue?: (val: type) => any;
    valueChange?: (val: type) => void;
    virtualData?: () => type | Promise<type>;
    dbReadOnly?: boolean;
    display?: () => ColumnInEntityDisplaySettings;
}
export declare type ColumnOptions<type> = DataColumnSettings<type> | string;




export interface ColumnInAreaDisplaySettings<rowType> {

    caption?: string;
    readonly?: boolean;
    inputType?: string;
    designMode?: boolean;
    getValue?: (row: rowType) => any;
    hideDataOnInput?: boolean;
    cssClass?: (string | ((row: rowType) => string));
    defaultValue?: (row: rowType) => any;
    onUserChangedValue?: (row: rowType) => void;
    click?: (row: rowType) => void;
    allowClick?: (row: rowType) => boolean;
    clickIcon?: string;
    dropDown?: DropDownOptions;
    column?: Column<any>;
    width?: string;
}


export interface ColumnInEntityDisplaySettings {
    dropDown?: DropDownOptions;
    width?: string;
    getValue?: () => any;
    hideDataOnInput?: boolean;
    click?: () => void;
    allowClick?: () => boolean;
    clickIcon?: string;
}
export interface DropDownOptions {

    items?: DropDownItem[] | string[] | any[];
    source?: DropDownSource<any>;
}


export interface DropDownItem {
    id?: any;
    caption?: any;
}
export interface FilteredColumnSetting<rowType> extends ColumnInAreaDisplaySettings<rowType> {
    _showFilter?: boolean;
}



export interface RowEvents {
    rowDeleted?: () => void;
    rowSaved?: (newRow: boolean) => void;
    rowReset?: (newRow: boolean) => void;
}
