import { Filter } from "../filter/filter-interfaces";
import { Column } from "../column";
import { ColumnStorage } from "../column-interfaces";

export class ObjectColumn<T> extends Column<T>{
    __getStorage() {
        return new TagStorage();
    }
    contains(value: Column<string> | string) {

        var val:string;
        if (value instanceof Column)
        val =  value.toRawValue(value.value);
      else
         val =  value;
        return new Filter(add => add.containsCaseInsensitive(this, JSON.stringify(val)));
    }
}
class TagStorage implements ColumnStorage<any>{
    toDb(val: any) {
        return JSON.stringify(val);
    }
    fromDb(val: any): string[] {
        return JSON.parse(val);
    }

}
