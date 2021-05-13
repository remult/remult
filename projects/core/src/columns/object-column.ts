import { Filter } from "../filter/filter-interfaces";
import { Column, columnBridgeToDefs } from "../column";
import { dbLoader } from "../column-interfaces";
import { columnBridge } from "../remult3";
import { StringColumn } from "./string-column";

export class ObjectColumn<T> extends Column<T>{
    __getStorage() {
        return new TagStorage();
    }
    
  contains(value: StringColumn | string) {
    return new Filter(add => add.containsCaseInsensitive(new columnBridgeToDefs(this), value));
  }
}
class TagStorage implements dbLoader<any>{
    toDb(val: any) {
        return JSON.stringify(val);
    }
    fromDb(val: any): string[] {
        if (val && val.toString().length > 0)
            return JSON.parse(val);
        return undefined;
    }

}
