import { DateTimeColumn } from "../../column";
import { dbLoader } from "../../column-interfaces";

export class DateTimeStorage implements dbLoader<string>{
  toDb(val: string) {
    return DateTimeColumn.stringToDate(val);
  }
  fromDb(val: any): string {
    if (typeof val === 'string')
      val = new Date(val);
    var d = val as Date;
    return DateTimeColumn.dateToString(d);
  }

}