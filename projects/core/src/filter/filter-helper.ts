
import { AndFilter, Filter } from './filter-interfaces';
import { comparableFilterItem, EntityColumn, EntityWhere, EntityWhereItem, FindOptions, Repository, supportsContains } from "../remult3";
import { ColumnDefinitions } from "../column-interfaces";
import { getColumnDefinition } from '../../../angular';

export class FilterHelper<rowType> {
  filterRow: rowType;
  filterColumns: ColumnDefinitions[] = [];
  forceEqual: ColumnDefinitions[] = [];
  constructor(private reloadData: () => void, private repository: Repository<rowType>) {

  }
  isFiltered(columnInput: ColumnDefinitions | EntityColumn<any, any>) {

    return this.filterColumns.indexOf(getColumnDefinition(columnInput)) >= 0;
  }
  filterColumn(columnInput: ColumnDefinitions | EntityColumn<any, any>, clearFilter: boolean, forceEqual: boolean) {
    let column = getColumnDefinition(columnInput);
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
      let val = this.filterRow[c.key];
      let w: EntityWhereItem<rowType> = item => {
        let itemForFilter: comparableFilterItem<any> & supportsContains<any> = item[c.key];
        let f: Filter = itemForFilter.isEqualTo(val);
        if (c.dataType == String && !this.forceEqual.find(x => c.key == x.key))
          f = itemForFilter.contains(val);
        else if (c.dataType == Date) {
          if (val) {
            let v = <Date>val;
            v = new Date(v.getFullYear(), v.getMonth(), v.getDate());

            f = itemForFilter.isGreaterOrEqualTo(v).and(itemForFilter.isLessThan((new Date(v.getFullYear(), v.getMonth(), v.getDate() + 1))));
          }
        }
        return f;

      }
      //@ts-ignore
      // if (c instanceof StringColumn) {
      //   let fe = this.forceEqual;
      //   if (fe.indexOf(c) < 0)
      //     f = c.contains(val);
      //   if (val === undefined || val == '')
      //     f = c.isEqualTo('');
      // }
      // if (c instanceof ObjectColumn) {
      //   let fe = this.forceEqual;
      //   if (fe.indexOf(c) < 0)
      //     f = c.contains(val);
      //   if (val === undefined || val == '')
      //     f = c.isEqualTo('');
      // }
      // if (c instanceof DateTimeColumn) {
      //   if (val) {
      //     let v = <Date>val;
      //     v = new Date(v.getFullYear(), v.getMonth(), v.getDate());

      //     f = c.isGreaterOrEqualTo(v).and(c.isLessThan((new Date(v.getFullYear(), v.getMonth(), v.getDate() + 1))));

      //   }
      // }

      if (opt.where) {
        let x = opt.where;
        opt.where = r => new AndFilter(this.repository.translateWhereToFilter(x), this.repository.translateWhereToFilter(w));
      }
      else opt.where = r => this.repository.translateWhereToFilter(w);
    });
  }
}
