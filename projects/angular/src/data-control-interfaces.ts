import { Column, ColumnSettings, Entity, ValueListColumn, ValueListItem, ValueOrEntityExpression } from "@remult/core";

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

export function decorateDataSettings(col: Column<any>, x: DataControlSettings) {
    if (!x.caption && col.defs.caption)
        x.caption = col.defs.caption;
    if (!x.inputType && col.defs.inputType)
        x.inputType = col.defs.inputType;
    let settings: ColumnSettings = col["__settings"];
    if (x.readOnly == undefined) {
        if (settings.sqlExpression)
            x.readOnly = true;
        else

            if (typeof settings.allowApiUpdate === 'boolean')
                x.readOnly = !settings.allowApiUpdate;


    }


    col[__displayResult] = __getDataControlSettings(col);
    if (col[__displayResult]) {
        if (!x.getValue && col[__displayResult].getValue) {
            x.getValue = e => {
                let c: Column = col;
                if (e)
                    c = e.columns.find(c) as Column;
                if (!c[__displayResult])
                    c[__displayResult] = __getDataControlSettings(c);
                return c[__displayResult].getValue(e);
            };
        }
        if (!x.click && col[__displayResult].click) {
            x.click = e => {
                let c: Column = col;
                if (e)
                    c = e.columns.find(c) as Column;
                if (!c[__displayResult])
                    c[__displayResult] = __getDataControlSettings(c);
                c[__displayResult].click(e);
            };
        }
        if (!x.allowClick && col[__displayResult].allowClick) {
            x.allowClick = e => {
                let c: Column = col;
                if (e)
                    c = e.columns.find(c) as Column;
                if (!c[__displayResult])
                    c[__displayResult] = __getDataControlSettings(c);
                return c[__displayResult].allowClick(e);
            };
        }
        for (const key in col[__displayResult]) {
            if (col[__displayResult].hasOwnProperty(key)) {
                const val = col[__displayResult][key];
                if (val !== undefined && x[key] === undefined) {
                    x[key] = val;
                }
            }
        }
    }
}
const __displayResult = Symbol("__displayResult");

export function __getDataControlSettings(col: Column): DataControlSettings {
    if (col[configDataControlField]) {
        let r = {};
        col[configDataControlField](r);
        return r;
    } if (col instanceof ValueListColumn) {
        col[configDataControlField] = (x: DataControlSettings) => {
            x.valueList = col.getOptions();
        };
    }
    return undefined;
}