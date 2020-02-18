import { Column } from "../column";
import { Entity } from "../entity";
import { Filter } from "../filter/filter";

import { AndFilter } from "../filter/and-filter";
import { FilterBase } from '../filter/filter-interfaces';

export class CompoundIdColumn extends Column<string>
{
  private columns: Column<any>[];
  constructor(entity: Entity<string>, ...columns: Column<any>[]) {
    super();
    this.columns = columns;
  }
  __isVirtual() { return true; }
  isEqualTo(value: Column<string> | string): Filter {
    return new Filter(add => {
      let val = this.__getVal(value);
      let id = val.split(',');
      let result: FilterBase;
      this.columns.forEach((c, i) => {
        if (!result)
          result = c.isEqualTo(id[i]);
        else
          result = new AndFilter(result, c.isEqualTo(id[i]));
      });
      return result.__applyToConsumer(add);
    });
  }
  __addIdToPojo(p: any) {
    if (p.id)
      return;
    let r = "";
    this.columns.forEach(c => {
      if (r.length > 0)
        r += ',';
      r += p[c.defs.key];
    });
    p.id = r;

  }
  resultIdFilter(id: string, data: any) {
    return new Filter(add => {
      let idParts: any[] = [];
      if (id != undefined)
        idParts = id.split(',');
      let result: FilterBase;
      this.columns.forEach((c, i) => {
        let val = undefined;
        if (i < idParts.length)
          val = idParts[i];
        if (data[c.defs.key] != undefined)
          val = data[c.defs.key];
        if (!result)
          result = c.isEqualTo(val);
        else
          result = new AndFilter(result, c.isEqualTo(val));
      });
      return result.__applyToConsumer(add);
    });
  }
}