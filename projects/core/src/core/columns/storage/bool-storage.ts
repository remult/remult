import { ColumnStorage } from "../../column-interfaces";
import { isString } from "util";

export class BoolStorage implements ColumnStorage<any>{
    toDb(val: any) {
      return val;
    }
    fromDb(val: any): any {
      if (isString(val))
        return val === "true";
      return val;
    }
  
  }