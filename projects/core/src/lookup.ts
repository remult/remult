import { Entity } from "./entity";
import { DataList } from "./dataList";
import { EntityProvider, EntityWhere, FindOptions, translateEntityWhere, updateEntityBasedOnWhere } from "./data-interfaces";
import { Column } from "./column";



import { FilterSerializer } from "./filter/filter-consumer-bridge-to-url-builder";
import { Filter } from './filter/filter-interfaces';

export class Lookup<lookupIdType, entityType extends Entity<lookupIdType>> {

  constructor(private entity: entityType, private entityProvider: EntityProvider<entityType>) {
    this.restList = new DataList<entityType>(entityProvider);

  }

  private restList: DataList<entityType>;
  private cache = new Map<string, lookupRowInfo<entityType>>();

  get(filter: Column<lookupIdType> | EntityWhere<entityType>): entityType {
    return this.getInternal(filter).value;
  }
  found(filter: Column<lookupIdType> | ((entityType: entityType) => Filter)): boolean {
    return this.getInternal(filter).found;
  }

  private getInternal(filter: Column<lookupIdType> | EntityWhere<entityType>): lookupRowInfo<entityType> {
    let find: FindOptions<entityType> = {};
    if (filter instanceof Column)
      find.where = (e) => e.columns.idColumn.isEqualTo(filter);
    else {
      find.where = e => translateEntityWhere(filter, e);
    }


    return this._internalGetByOptions(find);
  }

  _internalGetByOptions(find: FindOptions<entityType>): lookupRowInfo<entityType> {

    let key = "";

    let f = new FilterSerializer()
    if (find.where)
      translateEntityWhere(find.where, this.entity).__applyToConsumer(f);
    key = JSON.stringify(f);

    if (this.cache == undefined)
      this.cache = new Map<string, lookupRowInfo<entityType>>();
    let res = this.cache.get(key);
    if (res!==undefined) {
      if (res.value.__entityData._deleted) {
        res = undefined;
        this.cache.set(key, undefined);
      } else
        return this.cache.get(key);
    }
    res = new lookupRowInfo<entityType>();
    res.value = <entityType>this.entityProvider.create();
    updateEntityBasedOnWhere(find.where, res.value);
    this.cache.set(key, res);
    if (find == undefined || key == undefined || f.hasUndefined) {
      res.loading = false;
      res.found = false;
      res.promise = Promise.resolve(res);
      return res;
    } else {

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

  whenGet(filter: Column<lookupIdType> | EntityWhere<entityType>) {
    return this.getInternal(filter).promise.then(r => r.value);
  }
}

export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>

}