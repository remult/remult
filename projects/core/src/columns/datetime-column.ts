import { Column, ComparableColumn } from "../column";
import { ColumnSettings } from "../column-interfaces";
import { DateTimeStorage } from "./storage/datetime-storage";

export class DateTimeColumn extends ComparableColumn<Date>{
  constructor(settings?: ColumnSettings<Date>) {
    super({ displayValue: () => this.value.toLocaleString(),...settings });
  }
  getDayOfWeek() {
    return this.value.getDay();
  }
  __defaultStorage() {
    return new DateTimeStorage();
  }
  fromRawValue(value: any) {
    return DateTimeColumn.stringToDate(value);
  }
  toRawValue(value: Date) {
    return DateTimeColumn.dateToString(value);
  }

  static stringToDate(val: string) {
    if (val == undefined)
      return undefined;
    if (val == '')
      return undefined;
    if (val.startsWith('0000-00-00'))
      return undefined;
    return new Date(Date.parse(val));
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    if (!d)
      return '';
    return d.toISOString();
  }


}
