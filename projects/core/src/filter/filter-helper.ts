import { Entity } from "../entity";
import { Column, DateTimeColumn, StringColumn } from "../column";




import { AndFilter, Filter } from './filter-interfaces';
import { ObjectColumn } from "../columns/object-column";
import {  FindOptions, Repository } from "../remult3";
import { columnDefs } from "../column-interfaces";

export class FilterHelper<rowType > {
  filterRow: rowType;
  filterColumns: columnDefs[] = [];
  forceEqual: columnDefs[] = [];
  constructor(private reloadData: () => void,private repository:Repository<rowType>) {

  }
  isFiltered(column: columnDefs) {
    return this.filterColumns.indexOf(column) >= 0;
  }
  filterColumn(column: columnDefs, clearFilter: boolean, forceEqual: boolean) {
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

      //@ts-ignore
      let val = this.filterRow.columns.find(c).value;
      //@ts-ignore
      let f: Filter = c.isEqualTo(val);
      if (c instanceof StringColumn) {
        let fe = this.forceEqual;
        if (fe.indexOf(c) < 0)
          f = c.contains(val);
        if (val === undefined || val == '')
          f = c.isEqualTo('');
      }
      if (c instanceof ObjectColumn) {
        let fe = this.forceEqual;
        if (fe.indexOf(c) < 0)
          f = c.contains(val);
        if (val === undefined || val == '')
          f = c.isEqualTo('');
      }
      if (c instanceof DateTimeColumn) {
        if (val) {
          let v = <Date>val;
          v = new Date(v.getFullYear(), v.getMonth(), v.getDate());

          f = c.isGreaterOrEqualTo(v).and(c.isLessThan((new Date(v.getFullYear(), v.getMonth(), v.getDate() + 1))));

        }
      }

      if (opt.where) {
        let x = opt.where;
        opt.where = r => new AndFilter(this.repository.translateWhereToFilter(x), f);
      }
      else opt.where = r => f;
    });
  }
}
