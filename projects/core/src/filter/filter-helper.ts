import { Entity } from "../entity";
import { Column } from "../column";
import { FindOptions } from "../data-interfaces";
import { DateTimeColumn } from "../columns/datetime-column";
import { StringColumn } from "../columns/string-column";
import { AndFilter } from "./and-filter";
import { FilterBase } from './filter-interfaces';

export class FilterHelper<rowType extends Entity> {
  filterRow: rowType;
  filterColumns: Column[] = [];
  forceEqual: Column[] = [];
  constructor(private reloadData: () => void) {

  }
  isFiltered(column: Column) {
    return this.filterColumns.indexOf(column) >= 0;
  }
  filterColumn(column: Column, clearFilter: boolean, forceEqual: boolean) {
    if (!column)
      return;
    if (clearFilter) {
      this.filterColumns.splice(this.filterColumns.indexOf(column, 1), 1);
      this.forceEqual.splice(this.forceEqual.indexOf(column, 1), 1);
    }
    else if (this.filterColumns.indexOf(column) < 0) {
      this.filterColumns.push(column);
      if (forceEqual)
        this.forceEqual.push(column);
    }
    this.reloadData();
  }
  addToFindOptions(opt: FindOptions<rowType>) {
    this.filterColumns.forEach(c => {

      let val = this.filterRow.columns.find(c).value;
      let f: FilterBase = c.isEqualTo(val);
      if (c instanceof StringColumn) {
        let fe = this.forceEqual;
        if (fe.indexOf(c) < 0)
          f = c.isContains(val);
        if (val === undefined || val == '')
          f = c.isEqualTo('');
      }
      if (c instanceof DateTimeColumn) {
        if (val) {
          let v = DateTimeColumn.stringToDate(val);
          v = new Date(v.getFullYear(), v.getMonth(), v.getDate());

          f = c.isGreaterOrEqualTo(v).and(c.isLessThan((new Date(v.getFullYear(), v.getMonth(), v.getDate() + 1))));

        }
      }

      if (opt.where) {
        let x = opt.where;
        opt.where = r => new AndFilter(x(r), f);
      }
      else opt.where = r => f;
    });
  }
}
