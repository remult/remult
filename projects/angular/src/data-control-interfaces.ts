import { EntityColumn, ColumnDefinitions, ColumnSettings, Entity, ValueListItem } from "@remult/core";


export type DataControlInfo<rowType> = DataControlSettings<rowType> | EntityColumn<any, any>;
export interface DataControlSettings<entityType = any, colType = any> {

    column?: ColumnDefinitions | EntityColumn<any, any>;
    getValue?: (row: entityType, val: EntityColumn<colType, entityType>) => any;
    readOnly?: ValueOrEntityExpression<boolean, entityType>;
    cssClass?: (string | ((row: entityType) => string));

    caption?: string;
    visible?: (row: entityType, val: EntityColumn<colType, entityType>) => boolean;

    click?: (row: entityType, val: EntityColumn<colType, entityType>) => void;
    valueChange?: (row: entityType, val: EntityColumn<colType, entityType>) => void;
    allowClick?: (row: entityType, val: EntityColumn<colType, entityType>) => boolean;
    clickIcon?: string;

    valueList?: ValueListItem[] | string[] | any[] | Promise<ValueListItem[]> | ((context) => Promise<ValueListItem[]>);
    inputType?: string; //used: password,date,tel,text,checkbox,number
    hideDataOnInput?: boolean;//consider also setting the width of the data on input - for datas with long input
    forceEqualFilter?: boolean;

    width?: string;
}


export function extend<T extends ColumnDefinitions>(col: T): {
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

export function getColumnDefinition(col: ColumnDefinitions | EntityColumn<any, any>) {
    if (!col)
        return undefined;
    let r = col as ColumnDefinitions;
    let c = col as EntityColumn<any, any>;
    if (c.defs)
        r = c.defs;
    return r;

}
export function decorateDataSettings(colInput: ColumnDefinitions | EntityColumn<any, any>, x: DataControlSettings) {

    let col = getColumnDefinition(colInput);
    if (col.target) {
        let settingsOnColumnLevel = Reflect.getMetadata(configDataControlField, col.target, col.key);
        if (settingsOnColumnLevel) {
            for (const key in settingsOnColumnLevel) {
                if (Object.prototype.hasOwnProperty.call(settingsOnColumnLevel, key)) {
                    const element = settingsOnColumnLevel[key];
                    if (!x[key])
                        x[key] = element;
                }
            }
        }
    }
    if (col.dataType) {
        let settingsOnColumnLevel = Reflect.getMetadata(configDataControlField, col.dataType);
        if (settingsOnColumnLevel) {
            for (const key in settingsOnColumnLevel) {
                if (Object.prototype.hasOwnProperty.call(settingsOnColumnLevel, key)) {
                    const element = settingsOnColumnLevel[key];
                    if (!x[key])
                        x[key] = element;
                }
            }
        }
    }

    if (!x.caption && col.caption)
        x.caption = col.caption;

    if (!x.inputType && col.inputType)
        x.inputType = col.inputType;

    if (x.readOnly == undefined) {
        if (col.dbReadOnly)
            x.readOnly = true;

        if (typeof col.evilOriginalSettings.allowApiUpdate === 'boolean')
            x.readOnly = !col.evilOriginalSettings.allowApiUpdate;
    }
}
const __displayResult = Symbol("__displayResult");

export function __getDataControlSettings(col: ColumnDefinitions): DataControlSettings {
    let settings = Reflect.getMetadata(configDataControlField, col.target, col.key);

    // if (col[configDataControlField]) {
    //     let r = {};
    //     col[configDataControlField](r);
    //     return r;
    // }
    /*if (col instanceof ValueListColumn) {
        col[configDataControlField] = (x: DataControlSettings) => {
            x.valueList = col.getOptions();
        };
    }*/
    return undefined;
}
export declare type ValueOrEntityExpression<valueType, entityType> = valueType | ((e: entityType) => valueType);


export function DataControl<entityType = any, colType = any>(settings: DataControlSettings<entityType, colType>) {
    return (target, key?) => {
        Reflect.defineMetadata(configDataControlField, settings, target, key);
        if (key === undefined)
            return target;
    }
}