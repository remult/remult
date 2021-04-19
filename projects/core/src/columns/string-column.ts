import { Column, ComparableColumn } from "../column";
import { Filter } from "../filter/filter-interfaces";

export class StringColumn extends ComparableColumn<string>{
 
    contains(value: StringColumn | string) {
      return new Filter(add => add.containsCaseInsensitive(this, this.__getVal(value)));
    }
    startsWith(value: StringColumn | string) {
      return new Filter(add => add.startsWith(this, this.__getVal(value)));
    }
  } 