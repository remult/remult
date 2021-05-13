import { dbLoader } from "../../column-interfaces";


export class BoolStorage implements dbLoader<any>{
    toDb(val: any) {
      return val;
    }
    fromDb(val: any): any {
      if (typeof val === 'string')
        return val === "true";
      return val;
    }
  
  }