import { Filter, EntityFilter, FindOptions, Repository } from "remult";
import { __updateEntityBasedOnWhere } from "remult/src/remult3";


export class Lookup<entityType> {

  constructor(private repository: Repository<entityType>) {


  }


  private cache = new Map<string, lookupRowInfo<entityType>>();

  get(filter: EntityFilter<entityType>): entityType {
    return this.getInternal(filter).value;
  }
  getId(id: any): entityType {
    return this.getInternal(this.repository.metadata.idMetadata.getIdFilter(id)).value;
  }
  found(filter: EntityFilter<entityType>): boolean {
    return this.getInternal(filter).found;
  }

  private getInternal(where: EntityFilter<entityType>): lookupRowInfo<entityType> {
    return this._internalGetByOptions({ where });
  }

  _internalGetByOptions(find: FindOptions<entityType>): lookupRowInfo<entityType> {
    let f = Filter.entityFilterToJson(this.repository.metadata, find.where);
    let key = JSON.stringify(f);
    let res = this.cache.get(key);
    if (res !== undefined) {
      if (this.repository.getEntityRef(res.value).wasDeleted()) {
        res = undefined;
        this.cache.set(key, undefined);
      } else
        return this.cache.get(key);
    }
    res = new lookupRowInfo<entityType>();
    res.value = <entityType>this.repository.create();
    __updateEntityBasedOnWhere(this.repository.metadata, find.where, res.value);
    this.cache.set(key, res);
    let foundNonUnDefined = false;
    for (const key in f) {
      if (Object.prototype.hasOwnProperty.call(f, key)) {
        const element = f[key];
        if (element !== undefined) {
          foundNonUnDefined = true;
          break;
        }
      }
    }
    if (find == undefined || key == undefined || !foundNonUnDefined) {
      res.loading = false;
      res.found = false;
      res.promise = Promise.resolve(res);
      return res;
    } else {

      res.promise = this.repository.find(find).then(r => {
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

  getAsync(filter: EntityFilter<entityType>) {
    return this.getInternal(filter).promise.then(r => r.value);
  }
}

export class lookupRowInfo<type> {
  found = false;
  loading = true;
  value: type = {} as type;
  promise: Promise<lookupRowInfo<type>>
}

