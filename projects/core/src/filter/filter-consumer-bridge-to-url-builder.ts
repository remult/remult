
import { UrlBuilder } from "../url-builder";
import { Column } from "../column";
import { StringColumn } from "../columns/string-column";
import { FilterConsumer } from './filter-interfaces';

export class FilterConsumnerBridgeToUrlBuilder implements FilterConsumer {
    constructor(private url: UrlBuilder) {
  
    }
  
    public isEqualTo(col: Column<any>, val: any): void {
      this.url.add(col.jsonName, val);
    }
  
    public isDifferentFrom(col: Column<any>, val: any): void {
      this.url.add(col.jsonName + '_ne', val);
    }
  
    public isGreaterOrEqualTo(col: Column<any>, val: any): void {
      this.url.add(col.jsonName + '_gte', val);
    }
  
    public isGreaterThan(col: Column<any>, val: any): void {
      this.url.add(col.jsonName + '_gt', val);
    }
  
    public isLessOrEqualTo(col: Column<any>, val: any): void {
      this.url.add(col.jsonName + '_lte', val);
    }
  
    public isLessThan(col: Column<any>, val: any): void {
      this.url.add(col.jsonName + '_lt', val);
    }
    public isContains(col: StringColumn, val: any): void {
      this.url.add(col.jsonName + "_contains", val);
    }
    public isStartsWith(col: StringColumn, val: any): void {
      this.url.add(col.jsonName + "_st", val);
    }
  }