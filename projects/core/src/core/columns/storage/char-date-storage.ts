import { ColumnStorage } from "../../dataInterfaces1";

export class CharDateStorage implements ColumnStorage<string> {
    toDb(val: string) {
      return val.replace(/-/g, '');
    }
    fromDb(val: any): string {
      return val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6, 8);
    }
  }