import { isDate, isString } from "util";
import { ColumnStorage } from "../../column-interfaces";
import { DateTimeColumn } from "../datetime-column";
export class DateTimeStorage implements ColumnStorage<string>{
  toDb(val: string) {
    return DateTimeColumn.stringToDate(val);
  }
  fromDb(val: any): string {
    if (isString(val))
      val = new Date(val);
    var d = val as Date;
    return DateTimeColumn.dateToString(d);
  }

}