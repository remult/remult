
import { UrlBuilder } from "../url-builder";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer } from './filter-interfaces';

export class FilterConsumnerBridgeToUrlBuilder implements FilterConsumer {
    constructor(private url: UrlBuilder) {
  
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
    public isContains(col: StringColumn, val: any): void {
      this.url.add(col.defs.key + "_contains", val);
    }
    public isStartsWith(col: StringColumn, val: any): void {
      this.url.add(col.defs.key + "_st", val);
    }
  }