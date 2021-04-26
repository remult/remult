import { Column, ComparableColumn } from "../column";
import { ColumnSettings } from "../column-interfaces";
import { DateTimeDateStorage } from "./storage/datetime-date-storage";

export class DateColumn extends ComparableColumn<Date>{
  constructor(settings?: ColumnSettings<Date>) {
    super({ inputType: 'date', displayValue: () => this.value.toLocaleDateString(), ...settings });
  }
  getDayOfWeek() {
    return new Date(this.value).getDay();
  }

  __defaultStorage() {
    return new DateTimeDateStorage();
  }
  toRawValue(value: Date) {
    return DateColumn.dateToString(value);
  }
  fromRawValue(value: any) {

    return DateColumn.stringToDate(value);
  }

  static stringToDate(value: string) {
    if (!value || value == '' || value == '0000-00-00')
      return undefined;
    let r =new Date(Date.parse(value)); 
    return  new Date(r.valueOf() + r.getTimezoneOffset() * 60000);
  }
  static dateToString(val: Date): string {
    var d = val as Date;
    if (!d)
      return '';
    return val.toISOString().split('T')[0];
  }

}
function addZeros(number: number, stringLength: number = 2) {
  let to = number.toString();
  while (to.length < stringLength)
    to = '0' + to;
  return to;
}