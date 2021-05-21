import { FilterConsumer, Filter } from './filter-interfaces';
import { AndFilter, OrFilter } from './filter-interfaces';
import { ColumnDefinitions } from "../column-interfaces";
import { filterHelper } from "../remult3";



export class FilterSerializer implements FilterConsumer {
  result: any = {};
  constructor() {

  }
  hasUndefined = false;
  add(key: string, val: any) {
    if (val === undefined)
      this.hasUndefined = true;
    let r = this.result;
    if (!r[key]) {
      r[key] = val;
      return;
    }
    let v = r[key];
    if (v instanceof Array) {
      v.push(val);
    }
    else
      v = [v, val];
    r[key] = v;
  }

  or(orElements: Filter[]) {
    this.add("OR", orElements.map(x => {
      let f = new FilterSerializer();
      x.__applyToConsumer(f);
      return f.result;
    }));
  }
  isNull(col: ColumnDefinitions): void {
    this.add(col.key + "_null", true);
  }
  isNotNull(col: ColumnDefinitions): void {
    this.add(col.key + "_null", false);
  }
  isIn(col: ColumnDefinitions, val: any[]): void {
    this.add(col.key + "_in", val.map(x => col.valueConverter.toJson(x)));
  }

  public isEqualTo(col: ColumnDefinitions, val: any): void {
    this.add(col.key, col.valueConverter.toJson(val));
  }

  public isDifferentFrom(col: ColumnDefinitions, val: any): void {
    this.add(col.key + '_ne', col.valueConverter.toJson(val));
  }

  public isGreaterOrEqualTo(col: ColumnDefinitions, val: any): void {
    this.add(col.key + '_gte', col.valueConverter.toJson(val));
  }

  public isGreaterThan(col: ColumnDefinitions, val: any): void {
    this.add(col.key + '_gt', col.valueConverter.toJson(val));
  }

  public isLessOrEqualTo(col: ColumnDefinitions, val: any): void {
    this.add(col.key + '_lte', col.valueConverter.toJson(val));
  }

  public isLessThan(col: ColumnDefinitions, val: any): void {
    this.add(col.key + '_lt', col.valueConverter.toJson(val));
  }
  public containsCaseInsensitive(col: ColumnDefinitions, val: any): void {
    this.add(col.key + "_contains", col.valueConverter.toJson(val));
  }
  public startsWith(col: ColumnDefinitions, val: any): void {
    this.add(col.key + "_st", col.valueConverter.toJson(val));
  }
}

export function unpackWhere(columns: ColumnDefinitions[], packed: any) {
  return extractWhere(columns, { get: (key: string) => packed[key] });
}
export function extractWhere(columns: ColumnDefinitions[], filterInfo: {
  get: (key: string) => any;
}) {
  let where: Filter = undefined;
  columns.forEach(col => {
    function addFilter(operation: string, theFilter: (val: any) => Filter, jsonArray = false) {
      let val = filterInfo.get(col.key + operation);
      if (val != undefined) {
        let addFilter = (val: any) => {
          let theVal = val;
          if (jsonArray) {
            let arr: [];
            if (typeof val === 'string')
              arr = JSON.parse(val);
            else
              arr = val;
            theVal = arr.map(x => col.valueConverter.fromJson(x));
          } else {
            theVal = col.valueConverter.fromJson(theVal);
          }
          let f = theFilter(theVal);
          if (f) {
            if (where)
              where = new AndFilter(where, f);
            else
              where = f;
          }
        };
        if (!jsonArray && val instanceof Array) {
          val.forEach(v => {
            addFilter(v);
          });
        }
        else
          addFilter(val);
      }
    }
    let c = new filterHelper(col);
    addFilter('', val => c.isEqualTo(val));
    addFilter('_gt', val => c.isGreaterThan(val));
    addFilter('_gte', val => c.isGreaterOrEqualTo(val));
    addFilter('_lt', val => c.isLessThan(val));
    addFilter('_lte', val => c.isLessOrEqualTo(val));
    addFilter('_ne', val => c.isDifferentFrom(val));
    addFilter('_in', val =>
      c.isIn(val), true);
    addFilter('_null', val => {
      val = val.toString().trim().toLowerCase();
      switch (val) {
        case "y":
        case "true":
        case "yes":
          return c.isEqualTo(null);
        default:
          return c.isDifferentFrom(null);
      }
    });
    addFilter('_contains', val => {

      return c.contains(val);

    });
    addFilter('_st', val => {
      return c.startsWith(val);
    });
  });
  let val = filterInfo.get('OR');
  if (val)
    where = new AndFilter(where, new OrFilter(...val.map(x =>
      unpackWhere(columns, x)

    )))
  return where;
}


export function packToRawWhere(w: Filter) {
  let r = new FilterSerializer();
  if (w)
    w.__applyToConsumer(r);
  return r.result;
}
