import { Allowed } from './Context';
import { Column } from './column';




export interface ColumnStorage<valueType> {
    toDb(val: valueType): any;
    fromDb(val: any): valueType;
}



export interface ColumnSettings<valueType> {
    key?: string;
    includeInApi?: Allowed;
    allowApiUpdate?: Allowed;

    caption?: string;
    defaultValue?: ValueOrExpression<valueType>;
    validate?: () => void | Promise<void>;
    valueChange?: () => void;

    dbName?: string;
    sqlExpression?: ValueOrExpression<string>;
    serverExpression?: () => valueType | Promise<valueType>;
    dbReadOnly?: boolean;
    dataControlSettings?: () => DataControlSettings<any>;

}
export declare type ColumnOptions<valueType> = ColumnSettings<valueType> | string;
export declare type ValueOrExpression<valueType> = valueType | (() => valueType);




export interface DataControlSettings<entityType> {

    column?: Column<any>;
    getValue?: (row: entityType) => any;
    readOnly?: boolean;
    cssClass?: (string | ((row: entityType) => string));

    caption?: string;


    click?: (row: entityType) => void;
    allowClick?: (row: entityType) => boolean;
    clickIcon?: string;

    dropDownItems?:  DropDownItem[] | string[] | any[] | Promise<DropDownItem[]> |(()=>Promise<DropDownItem[]>) ;
    inputType?: string; //used: password,date,phone,text,checkbox,number
    hideDataOnInput?: boolean;//consider also setting the width of the data on input - for datas with long input

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
