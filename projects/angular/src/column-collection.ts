
import { FieldMetadata, FieldRef, EntityMetadata, getEntityRef, IdEntity, ValueListItem, EntityRef, Allowed, FieldOptions, Context, ValueConverter } from "remult";

import { DataControlInfo, DataControlSettings, decorateDataSettings, getFieldDefinition, ValueOrEntityExpression } from "./data-control-interfaces";
import { FilterHelper } from "./filter-helper";
import { decorateColumnSettings } from 'remult/src/remult3';
import { ValueListValueConverter } from "remult/valueConverters";
import { ClassType } from "remult/classType";



export class FieldCollection<rowType = any> {

  constructor(public currentRow: () => any, private allowUpdate: () => boolean, public filterHelper: FilterHelper<rowType>, private showArea: () => boolean, private _getRowColumn: (row: rowType, col: FieldMetadata) => FieldRef<any, any>) {


  }
  __showArea() {
    return this.showArea();

  }
  __getColumn(map: DataControlSettings, record: any) {
    if (!map.field)
      return undefined;
    let result: FieldRef<any, any>;
    if (record)
      result = getEntityRef(record).fields.find(getFieldDefinition(map.field));
    if (!result)
      result = map.field as unknown as FieldRef<any, any>;
    return result;
  }



  __visible(col: DataControlSettings, row: any) {
    if (col.visible === undefined)
      return true;
    return this.getRowColumn({ col, row }, (c, row) => col.visible(row, c));
  }
  allowClick(col: DataControlSettings<any, any>, row: any) {
    if (!col.click)
      return false;
    if (!this._getEditable(col, row))
      return false;
    if (col.allowClick === undefined) {
      return true;
    }
    return this.getRowColumn({ col, row }, (c, row) => col.allowClick(row, c));
  }
  getRowColumn<T>(args: { col: DataControlSettings<any>, row: any }, what: (c: FieldRef<any, any>, row: any) => T) {
    let field: FieldRef<any, any>;
    let row = args.row;
    if (this._getRowColumn && args.col.field && row) {
      field = this._getRowColumn(row, getFieldDefinition(args.col.field));
    }
    if (!field)
      field = args.col.field as unknown as FieldRef<any, any>;
    if (!row && field)
      row = field.container;
    return what(field, row);
  }

  __dataControlStyle(map: DataControlSettings): string {

    if (map.width && map.width.trim().length > 0) {
      if ((+map.width).toString() == map.width)
        return map.width + "px";
      return map.width;
    }
    return undefined;

  }
  private settingsByKey: any = {};

  allowDesignMode: boolean;
  async add(...columns: DataControlInfo<rowType>[]): Promise<void>;
  async add(...columns: string[]): Promise<void>;
  async add(...columns: any[]) {
    var promises: Promise<void>[] = [];
    for (let c of columns) {
      if (!c)
        continue;
      let s: DataControlSettings<rowType>;
      let x = c as DataControlSettings<rowType>;
      let col = c as FieldMetadata;
      let ecol = c as FieldRef<any, any>;
      if (!x.field && col.valueConverter || ecol.metadata) {
        x = {
          field: c,
        }

      }
      if (x.field) {
        decorateDataSettings(x.field, x);
      }

      if (x.getValue) {
        s = x;
      }

      {
        promises.push(this.buildDropDown(x));
      }
      this.items.push(x);


    }
    await Promise.all(promises);
    return Promise.resolve();
  }
  private doWhenWeHaveContext: ((c: Context) => Promise<any>)[] = [];
  private context: Context;
  setContext(context: Context) {
    this.context = context;
    for (const what of this.doWhenWeHaveContext) {
      what(context);
    }
  }
  async buildDropDown(s: DataControlSettings) {
    if (s.valueList) {
      let orig = s.valueList;
      let result: ValueListItem[] = [];
      s.valueList = result;

      if (orig instanceof Array) {
        for (let item of orig) {
          let type = typeof (item);
          if (type == "string" || type == "number")
            result.push({ id: item, caption: item });
          else {
            let x = item as ValueListItem;
            if (x && x.id != undefined) {
              result.push(x);
            }
          }
        }
      }
      else if (typeof orig === "function") {
        let theFunc = orig as ((context: Context) => Promise<ValueListItem[]>);
        let todo = async (context: Context) => {
          let x = await theFunc(context);
          if (x === undefined)
            s.valueList = undefined;
          else
            result.push(...x);

        }
        if (this.context) {
          todo(this.context);
        }
        else
          this.doWhenWeHaveContext.push(async context => todo(context));

      }
      else {
        result.push(...(await (orig as (Promise<ValueListItem[]>))));
      }

    }
    return Promise.resolve();
  }

  designMode = false;
  colListChanged() {
    this._lastNumOfColumnsInGrid = -1;
    this._colListChangeListeners.forEach(x => x());
  };
  _colListChangeListeners: (() => void)[] = [];
  onColListChange(action: (() => void)) {
    this._colListChangeListeners.push(action);
  }
  moveCol(col: DataControlSettings, move: number) {
    let currentIndex = this.items.indexOf(col);
    let newIndex = currentIndex + move;
    if (newIndex < 0 || newIndex >= this.items.length)
      return;
    this.items.splice(currentIndex, 1);
    this.items.splice(newIndex, 0, col);
    this.colListChanged();


  }

  filterRows(col: DataControlSettings) {

    let forceEqual = col.forceEqualFilter;
    if (forceEqual === undefined)
      forceEqual = (col.valueList != undefined)
    this.filterHelper.filterColumn(col.field, false, forceEqual);
  }
  clearFilter(col: DataControlSettings) {

    this.filterHelper.filterColumn(col.field, true, false);
  }
  _shouldShowFilterDialog(col: DataControlSettings) {
    return false;
  }

  deleteCol(col: DataControlSettings) {
    this.items.splice(this.items.indexOf(col), 1);
    this.colListChanged();
  }
  addCol(col: DataControlSettings, newCol: DataControlSettings) {
    this.items.splice(this.items.indexOf(col) + 1, 0, newCol);
    this.colListChanged();
  }


  _getEditable(col: DataControlSettings, row: rowType) {
    if (!this.allowUpdate())
      return false;
    if (!col.field)
      return false
    if (col.readonly !== undefined)
      return !valueOrEntityExpressionToValue(col.readonly, row);
    return true;
  }
  _click(col: DataControlSettings, row: any) {
    this.getRowColumn({ col, row }, (c, r) => { col.click(r, c) });

  }

  _getColDisplayValue(col: DataControlSettings, row: rowType) {
    let r;
    if (col.getValue) {

      r = this.getRowColumn({ row, col }, (c, r) => col.getValue(r, c));




    }
    else if (col.field) {
      if (col.valueList) {
        for (let x of (col.valueList as ValueListItem[])) {
          if (x.id == this.__getColumn(col, row).value)
            return x.caption;
        }
      }
      r = this.__getColumn(col, row).displayValue;
    }


    return r;
  }
  _getColDataType(col: DataControlSettings) {
    if (col.inputType)
      return col.inputType;
    return "text";
  }
  _getColumnClass(col: DataControlSettings, row: any) {

    if (col.cssClass)
      if (typeof col.cssClass === 'function') {
        let anyFunc: any = col.cssClass;
        return anyFunc(row);
      }
      else return col.cssClass;
    return '';

  }

  _getError(col: DataControlSettings, r: any) {
    if (!col.field)
      return undefined;
    return this.__getColumn(col, r).error;
  }
  autoGenerateColumnsBasedOnData(defs: EntityMetadata<any>) {
    if (this.items.length == 0) {

      if (defs) {
        for (const c of defs.fields) {
          if (!(c.key == 'id' && c.valueType === String))
            this.add(c);
        }
      }
    }



  }

  __changeWidth(col: DataControlSettings, what: number) {
    let width = col.width;
    if (!width)
      width = '50';
    width = ((+width) + what).toString();
    col.width = width;
  }
  _colValueChanged(col: DataControlSettings, row: any) {
    if (!col.valueChange)
      return false;

    return this.getRowColumn({ col, row }, (c, row) => col.valueChange(row, c));


  }
  items: DataControlSettings[] = [];
  private gridColumns: DataControlSettings[];
  private nonGridColumns: DataControlSettings[];
  numOfColumnsInGrid = 5;

  private _lastColumnCount: number;
  private _lastNumOfColumnsInGrid: number;
  private _initColumnsArrays() {
    if (this._lastColumnCount != this.items.length || this._lastNumOfColumnsInGrid != this.numOfColumnsInGrid) {
      this._lastNumOfColumnsInGrid = this.numOfColumnsInGrid;
      this._lastColumnCount = this.items.length;
      this.gridColumns = [];
      this.nonGridColumns = [];
      let i = 0;
      for (let c of this.items) {
        if (i++ < this._lastNumOfColumnsInGrid)
          this.gridColumns.push(c);
        else
          this.nonGridColumns.push(c);
      }
    }
  }
  getGridColumns() {
    this._initColumnsArrays();
    return this.gridColumns;
  }
  getNonGridColumns() {
    this._initColumnsArrays();
    return this.nonGridColumns;
  }
}


export function valueOrEntityExpressionToValue<T, entityType>(f: ValueOrEntityExpression<T, entityType>, e: entityType): T {
  if (typeof f === 'function') {
    let x = f as any;
    return x(e);
  }
  return <T>f;
}


export class InputField<valueType> implements FieldRef<any, valueType> {
  private options: FieldOptions;
  dataControl: DataControlSettings;
  constructor(
    settings: FieldOptions<any, valueType>
      & DataControlSettings
      & {


        context?: Context
      }) {

    if (!settings.dbName)
      settings.dbName = settings.key;

    this.options = decorateColumnSettings(settings);
    this.dataControl = settings;
    if (!this.dataControl.valueList && this.options.valueConverter instanceof ValueListValueConverter) {
      this.dataControl.valueList = this.options.valueConverter.getOptions();
    }

    if (settings.caption)
      if (typeof this.options.caption === "function")
        settings.caption = this.options.caption(settings.context);
    if (!settings.caption)
      settings.caption = 'caption';

    if (!settings.key)
      settings.key = settings.caption;
    this.inputType = settings.inputType;
    if (settings.defaultValue) {
      this._value = settings.defaultValue(undefined, undefined) as unknown as valueType
    }

    this.originalValue = this._value;
    let valueConverter = this.options.valueConverter ? this.options.valueConverter : undefined;
    if (valueConverter)
      if (!settings.inputType) {
        settings.inputType = valueConverter.inputType;
      }
    this.metadata = {

      allowNull: settings.allowNull,
      caption: settings.caption,
      options: this.options,
      valueConverter: valueConverter,
      valueType: settings.valueType,
      key: settings.key,
      dbName: settings.dbName,
      dbReadOnly: false,
      inputType: settings.inputType,
      isServerExpression: false,

      target: undefined

    }


  }
  isNull() {
    return this.value === null;
  }
  load(): Promise<valueType> {
    throw new Error("Method not implemented.");
  }
  metadata: {
    readonly key: string;
    readonly target: ClassType<valueType>;
    readonly valueType: any;

    caption: string;
    readonly inputType: string;
    readonly allowNull: boolean;


    readonly isServerExpression: boolean;
    readonly dbReadOnly: boolean;
    readonly dbName: string;
    readonly valueConverter: ValueConverter<valueType>;
    readonly options: FieldOptions;
  };
  _value: valueType;
  inputType: string;
  error: string;
  get displayValue() {
    if (this.options.displayValue)
      return this.options.displayValue(this.value, undefined);
    return this.value.toString();
  }
  get value(): valueType { return this._value; }
  set value(val: valueType) {
    this._value = val;
    if (this.dataControl.valueChange)
      this.dataControl.valueChange(undefined, this)
  };
  originalValue: valueType;
  get inputValue(): string { return this.metadata.valueConverter.toInput(this.value, this.inputType); }
  set inputValue(val: string) { this.value = this.metadata.valueConverter.fromInput(val, this.inputType); };
  wasChanged(): boolean {
    return this.originalValue != this.value;
  }
  entityRef: EntityRef<any>;
  container: any;



}