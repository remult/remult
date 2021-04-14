import { Column, ComparableColumn } from "../column";
import { ColumnSettings } from "../column-interfaces";
import { BoolStorage } from "./storage/bool-storage";

export class NumberColumn extends ComparableColumn<number>{
  constructor(settings?: NumberColumnSettings) {
    super({ inputType: 'number', ...settings });
    let s = settings as NumberColumnSettings;
    if (s && s.decimalDigits) {
      this.__numOfDecimalDigits = s.decimalDigits;
    }
  }
  __numOfDecimalDigits: number = 0;
  protected __processValue(value: number) {

    this._tempInputValue = undefined;
    if (value != undefined && !(typeof value === "number"))
      return +value;
    return value;

  }
  fromRawValue(value: any) {
    if (value !== undefined)
      return +value;
    return undefined;
  }
  private _tempInputValue: string = undefined;
  get inputValue() {
    if (this._tempInputValue !== undefined)
      return this._tempInputValue;
    if (this.rawValue !== undefined)
      return this.rawValue.toString();
    return '0';
  }
  set inputValue(value: string) {
    this.rawValue = value;
    this._tempInputValue = undefined;
    if (value.startsWith('-')) {
      if (this.value == 0 || isNaN(this.value)) {
        this.value = 0;
        this._tempInputValue = value;
      }
    }
    else if (isNaN(this.value)) {
      this.value = 0;
      if (value == '')
        this._tempInputValue = '';
    }
  }
}
export interface NumberColumnSettings extends ColumnSettings<number> {
  decimalDigits?: number;
}

export class BoolColumn extends Column<boolean>{
  constructor(settings?: ColumnSettings<boolean>) {
    super({ inputType: 'checkbox', ...settings });

  }
  __defaultStorage() {
    return new BoolStorage();
  }
}