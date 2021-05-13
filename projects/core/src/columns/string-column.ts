import { Column, columnBridgeToDefs, ComparableColumn } from "../column";
import { Filter } from "../filter/filter-interfaces";


export class StringColumn extends ComparableColumn<string>{

  contains(value: StringColumn | string) {
    return new Filter(add => add.containsCaseInsensitive(new columnBridgeToDefs(this), value));
  }
  startsWith(value: StringColumn | string) {
    return new Filter(add => add.startsWith(new columnBridgeToDefs(this), value));
  }
}