
import { UrlBuilder } from "../url-builder";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer, FilterBase } from './filter-interfaces';
import { Entity } from '../entity';
import { AndFilter } from './and-filter';
import { EntityWhere } from '../data-interfaces';

export class FilterConsumnerBridgeToUrlBuilder implements FilterConsumer {
  constructor(private url: { add: (key: string, val: any) => void }) {

  }
  isIn(col: Column<any>, val: any[]): void {
    this.url.add(col.defs.key + "_in", JSON.stringify(val));
  }

  public isEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.defs.key, val);
  }

  public isDifferentFrom(col: Column<any>, val: any): void {
    this.url.add(col.defs.key + '_ne', val);
  }

  public isGreaterOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.defs.key + '_gte', val);
  }

  public isGreaterThan(col: Column<any>, val: any): void {
    this.url.add(col.defs.key + '_gt', val);
  }

  public isLessOrEqualTo(col: Column<any>, val: any): void {
    this.url.add(col.defs.key + '_lte', val);
  }

  public isLessThan(col: Column<any>, val: any): void {
    this.url.add(col.defs.key + '_lt', val);
  }
  public isContainsCaseInsensitive(col: StringColumn, val: any): void {
    this.url.add(col.defs.key + "_contains", val);
  }
  public isStartsWith(col: StringColumn, val: any): void {
    this.url.add(col.defs.key + "_st", val);
  }
}

export function unpackWhere(rowType: Entity<any>, packed: any) {
  return extractWhere(rowType, { get: (key: string) => packed[key] });
}
export function extractWhere(rowType: Entity<any>, filterInfo: {
  get: (key: string) => any;
}) {
  let where: FilterBase = undefined;
  rowType.columns.toArray().forEach(col => {
    function addFilter(operation: string, theFilter: (val: any) => FilterBase) {
      let val = filterInfo.get(col.defs.key + operation);
      if (val != undefined) {
        let addFilter = (val: any) => {
          let f = theFilter(col.fromRawValue(val));
          if (f) {
            if (where)
              where = new AndFilter(where, f);
            else
              where = f;
          }
        };
        if (val instanceof Array) {
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
    addFilter('_in', val => col.isIn(JSON.parse(val)));
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
  return where;
}
export function packWhere<entityType extends Entity<any>>(entity: entityType, where: EntityWhere<entityType>) {
  if (!where)
  return {};
  let w = where(entity);
  return packToRawWhere(w);

}

export function packToRawWhere(w: FilterBase) {
  let r = {};
  if (w)
    w.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder({
      add: (key: string, val: any) => {
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
    }));
  return r;
}
