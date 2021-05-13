import { dbLoader } from "../../column-interfaces";

export class CharDateStorage implements dbLoader<string> {
    toDb(val: string) {
      return val.replace(/-/g, '');
    }
    fromDb(val: any): string {
      return val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6, 8);
    }
  }