import { ColumnStorage } from "../../dataInterfaces1";
import { DateColumn } from "../date-column";

export class DateTimeDateStorage implements ColumnStorage<string>{
    toDb(val: string) {
  
      return DateColumn.stringToDate(val);
    }
    fromDb(val: any): string {
      var d = val as Date;
      return DateColumn.dateToString(d);
    }
  
  }