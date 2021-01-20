
import { UrlBuilder } from "../url-builder";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer, FilterBase } from './filter-interfaces';
import { Entity } from '../entity';
import { AndFilter, OrFilter } from './and-filter';
import { EntityWhere } from '../data-interfaces';
import { isString } from "util";

export class FilterSerializer implements FilterConsumer {
  result: any = {};
  constructor() {

  }
  add(key: string, val: any) {
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

  or(orElements: FilterBase[]) {
    this.add("or", orElements.map(x => {
      let f = new FilterSerializer();
      x.__applyToConsumer(f);
      return f.result;
    }));
  }
  isNull(col: Column<any>): void {
    this.add(col.defs.key + "_null", true);
  }
  isNotNull(col: Column<any>): void {
    this.add(col.defs.key + "_null", false);
  }
  isIn(col: Column, val: any[]): void {
    this.add(col.defs.key + "_in", val);
  }

  public isEqualTo(col: Column, val: any): void {
    this.add(col.defs.key, val);
  }

  public isDifferentFrom(col: Column, val: any): void {
    this.add(col.defs.key + '_ne', val);
  }

  public isGreaterOrEqualTo(col: Column, val: any): void {
    this.add(col.defs.key + '_gte', val);
  }

  public isGreaterThan(col: Column, val: any): void {
    this.add(col.defs.key + '_gt', val);
  }

  public isLessOrEqualTo(col: Column, val: any): void {
    this.add(col.defs.key + '_lte', val);
  }

  public isLessThan(col: Column, val: any): void {
    this.add(col.defs.key + '_lt', val);
  }
  public isContainsCaseInsensitive(col: StringColumn, val: any): void {
    this.add(col.defs.key + "_contains", val);
  }
  public isStartsWith(col: StringColumn, val: any): void {
    this.add(col.defs.key + "_st", val);
  }
}

export function unpackWhere(rowType: Entity, packed: any) {
  return extractWhere(rowType, { get: (key: string) => packed[key] });
}
export function extractWhere(rowType: Entity, filterInfo: {
  get: (key: string) => any;
}) {
  let where: FilterBase = undefined;
  rowType.columns.toArray().forEach(col => {
    function addFilter(operation: string, theFilter: (val: any) => FilterBase, jsonArray = false) {
      let val = filterInfo.get(col.defs.key + operation);
      if (val != undefined) {
        let addFilter = (val: any) => {
          let theVal = val;
          if (jsonArray) {
            let arr: [];
            if (isString(val))
              arr = JSON.parse(val);
            else
              arr = val;
            theVal = arr.map(x => col.fromRawValue(x));
          } else {
            theVal = col.fromRawValue(theVal);
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
    addFilter('', val => col.isEqualTo(val));
    addFilter('_gt', val => col.isGreaterThan(val));
    addFilter('_gte', val => col.isGreaterOrEqualTo(val));
    addFilter('_lt', val => col.isLessThan(val));
    addFilter('_lte', val => col.isLessOrEqualTo(val));
    addFilter('_ne', val => col.isDifferentFrom(val));
    addFilter('_in', val => col.isIn(val), true);
    addFilter('_null', val => {
      val = val.toString().trim().toLowerCase();
      switch (val) {
        case "y":
        case "true":
        case "yes":
          return col.isEqualTo(null);
        default:
          return col.isDifferentFrom(null);
      }
    });
    addFilter('_contains', val => {
      let c = col as StringColumn;
      if (c != null && c.isContains) {
        return c.isContains(val);
      }
    });
    addFilter('_st', val => {
      let c = col as StringColumn;
      if (c != null && c.isContains) {
        return c.isStartsWith(val);
      }
    });
  });
  let val = filterInfo.get('or');
  if (val)
    where = new AndFilter(where, new OrFilter(...val.map(x =>
      unpackWhere(rowType, x)

    )))
  return where;
}
export function packWhere<entityType extends Entity>(entity: entityType, where: EntityWhere<entityType>) {
  if (!where)
    return {};
  let w = where(entity);
  return packToRawWhere(w);

}

export function packToRawWhere(w: FilterBase) {
  let r = new FilterSerializer();
  if (w)
    w.__applyToConsumer(r);
  return r.result;
}
