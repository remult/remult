import { ColumnStorage } from "../../dataInterfaces1";
import { DateTimeColumn } from "../datetime-column";
export class DateTimeStorage implements ColumnStorage<string>{
    toDb(val: string) {
      return DateTimeColumn.stringToDate(val);
    }
    fromDb(val: any): string {
      var d = val as Date;
      return DateTimeColumn.dateToString(d);
    }
  
  }