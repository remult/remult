import { Column } from "../column";
import { ColumnSettings, ColumnOptions } from "../column-interfaces";
import { BoolStorage } from "./storage/bool-storage";

export class NumberColumn extends Column<number>{
  constructor(settingsOrCaption?: NumberColumnOptions) {
    super({ dataControlSettings: () => ({ inputType: 'number' }) }, settingsOrCaption);
    let s = settingsOrCaption as NumberColumnSettings;
    if (s && s.decimalDigits) {
      this.__numOfDecimalDigits = s.decimalDigits;
    }
  }
  __numOfDecimalDigits: number = 0;
  protected __processValue(value: number) {

    if (value != undefined && !(typeof value === "number"))
      return +value;
    return value;

  }
  fromRawValue(value: any) {
    if (value!==undefined)
      return +value;
      return undefined;
  }
}
export interface NumberColumnSettings extends ColumnSettings<number> {
  decimalDigits?: number;
}
export declare type NumberColumnOptions = NumberColumnSettings | string;
export class BoolColumn extends Column<boolean>{
  constructor(settingsOrCaption?: ColumnOptions<boolean>) {
    super({ dataControlSettings: () => ({ inputType: 'checkbox' }) }, settingsOrCaption);

  }
  __defaultStorage() {
    return new BoolStorage();
  }
}