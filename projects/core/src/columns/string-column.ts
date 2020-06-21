import { Column } from "../column";
import { Filter } from "../filter/filter";

export class StringColumn extends Column<string>{
 
    isContains(value: StringColumn | string) {
      return new Filter(add => add.isContainsCaseInsensitive(this, this.__getVal(value)));
    }
    isStartsWith(value: StringColumn | string) {
      return new Filter(add => add.isStartsWith(this, this.__getVal(value)));
    }
  }