import { Entity } from "./entity";
import { DataList } from "./dataList";
import { EntityProvider,  FindOptionsPerEntity } from "./data-interfaces";
import { Column } from "./column";

import { isFunction } from "util";
import { UrlBuilder } from "./url-builder";
import { FilterConsumnerBridgeToUrlBuilder } from "./filter/filter-consumer-bridge-to-url-builder";
import { FilterBase } from './filter/filter-interfaces';

export class Lookup<lookupIdType, entityType extends Entity<lookupIdType>> {

    constructor(private entity: entityType, private entityProvider: EntityProvider<entityType>) {
      this.restList = new DataList<entityType>(entityProvider);
  
    }
  
    private restList: DataList<entityType>;
    private cache: any = {};
  
    get(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): entityType {
      return this.getInternal(filter).value;
    }
    found(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): boolean {
      return this.getInternal(filter).found;
    }
  
    private getInternal(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)): lookupRowInfo<entityType> {
      let find: FindOptionsPerEntity<entityType> = {};
      if (filter instanceof Column)
        find.where = (e) => e.__idColumn.isEqualTo(filter);
      else if (isFunction(filter)) {
        find.where = e => filter(e);
      }
  
  
      return this._internalGetByOptions(find);
    }
  
    _internalGetByOptions(find: FindOptionsPerEntity<entityType>): lookupRowInfo<entityType> {
  
      let key = "";
      let url = new UrlBuilder("");
      if (find.where)
        find.where(this.entity).__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
      key = url.url;
  
      if (this.cache == undefined)
        this.cache = {};
      if (this.cache[key]) {
        return this.cache[key];
      } else {
        let res = new lookupRowInfo<entityType>();
        this.cache[key] = res;
  
        if (find == undefined || key == undefined) {
          res.loading = false;
          res.found = false;
          return res;
        } else {
          res.value = <entityType>this.entityProvider.create();
          res.promise = this.restList.get(find).then(r => {
            res.loading = false;
            if (r.length > 0) {
              res.value = r[0];
              res.found = true;
            }
            return res;
          });
        }
        return res;
      }
    }
  
    whenGet(filter: Column<lookupIdType> | ((entityType: entityType) => FilterBase)) {
      return this.getInternal(filter).promise.then(r => r.value);
    }
  }

  export class lookupRowInfo<type> {
    found = false;
    loading = true;
    value: type = {} as type;
    promise: Promise<lookupRowInfo<type>>
  
  }