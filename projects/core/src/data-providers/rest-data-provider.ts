

import { EntityDataProvider, DataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { Entity } from '../entity';
import { FilterSerializer, packToRawWhere } from '../filter/filter-consumer-bridge-to-url-builder';
import { UrlBuilder } from '../url-builder';
import { Filter } from '../filter/filter-interfaces';
import { isArray, isObject } from 'util';

export class RestDataProvider implements DataProvider {
  constructor(private url: string, private http: RestDataProviderHttpProvider) {

  }
  public getEntityDataProvider(entity: Entity): EntityDataProvider {
    return new RestEntityDataProvider(this.url + '/' + entity.defs.name, this.http);
  }
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
class RestEntityDataProvider implements EntityDataProvider {

  constructor(private url: string, private http: RestDataProviderHttpProvider) {

  }

  public async count(where: Filter): Promise<number> {
    let url = new UrlBuilder(this.url);
    url.add("__action", "count");
    let filterObject: any;

    if (where) {
      filterObject = packToRawWhere(where);
      if (addFilterToUrlAndReturnTrueIfSuccesfull(where, url))
        filterObject = undefined;
    }
    if (filterObject)
      return this.http.post(url.url, filterObject).then(r => +(r.count));
    else
      return this.http.get(url.url).then(r => +(r.count));
  }
  public find(options: EntityDataProviderFindOptions): Promise<Array<any>> {
    let url = new UrlBuilder(this.url);
    let filterObject: any;
    if (options) {
      if (options.where) {

        filterObject = packToRawWhere(options.where);//        options.where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
        if (addFilterToUrlAndReturnTrueIfSuccesfull(filterObject, url))
          filterObject = undefined;
      }
      if (options.orderBy && options.orderBy.Segments) {
        let sort = '';
        let order = '';
        options.orderBy.Segments.forEach(c => {
          if (sort.length > 0) {
            sort += ", ";
            order += ", ";
          }
          sort += c.column.defs.key;
          order += c.descending ? "desc" : "asc";

        });
        url.add('_sort', sort);
        url.add('_order', order);
      }
      if (options.limit)
        url.add('_limit', options.limit);
      if (options.page)
        url.add('_page', options.page);
      if (options.__customFindData)
        url.addObject(options.__customFindData);
    }
    if (filterObject) {
      url.add("__action", "get");
      return this.http.post(url.url, filterObject);
    }
    else
      return this.http.get(url.url);
  }

  public update(id: any, data: any): Promise<any> {
    return this.http.put(this.url + '/' + encodeURIComponent(id), data);

  }

  public delete(id: any): Promise<void> {
    return this.http.delete(this.url + '/' + encodeURIComponent(id));
  }

  public insert(data: any): Promise<any> {
    return this.http.post(this.url, data);
  }
}
function JsonContent(add: (name: string, value: string) => void) {
  add('Content-type', "application/json");
}

export interface RestDataProviderHttpProvider {
  post(url: string, data: any): Promise<any>;
  delete(url: string): Promise<void>;
  put(url: string, data: any): Promise<any>;
  get(url: string): Promise<any>;

}
export class RestDataProviderHttpProviderUsingFetch implements RestDataProviderHttpProvider {
  constructor(private addRequestHeader?: (add: ((name: string, value: string) => void)) => void) {
    if (!addRequestHeader)
      this.addRequestHeader = () => { };
  }
  get(url: string) {
    return myFetch(url, undefined, this.addRequestHeader).then(r => {
      return r;
    });
  }
  put(url: string, data: any) {
    return myFetch(url, {
      method: 'put',
      body: JSON.stringify(data)
    }, this.addRequestHeader, JsonContent)
  }
  delete(url: string) {
    let h = new Headers();
    this.addRequestHeader((name, value) => h.append(name, value));
    return fetch(url, { method: 'delete', credentials: 'include' }).then(onSuccess, onError);
  }
  post(url: string, data: any) {
    return myFetch(url, {
      method: 'post',
      body: JSON.stringify(data)
    }, this.addRequestHeader, JsonContent)
  }

}
function myFetch(url: string, init: RequestInit, ...addRequestHeader: ((add: ((name: string, value: string) => void)) => void)[]): Promise<any> {
  if (!init)
    init = {};
  if (!init.headers)
    init.headers = new Headers();
  var h = init.headers as Headers;
  addRequestHeader.forEach(x => x((n, v) => h.append(n, v)));
  init.credentials = 'include';

  return fetch(url, init).then(response => {

    return onSuccess(response);

  }).catch(async error => {
    let r = await error;
    console.log(r);
    throw r;
  });
}
function onSuccess(response: Response) {
  if (response.status == 204)
    return;
  if (response.status >= 200 && response.status < 300)

    return response.json();
  else {
    throw response.json().then(x => {

      if (!x.message)
        x.message = response.statusText;
      return x;
    }).catch(() => {
      throw {
        message: response.statusText,
        url: response.url,
        status: response.status

      };
    })
  }


}




function onError(error: any) {
  throw Promise.resolve(error);
}

export function addFilterToUrlAndReturnTrueIfSuccesfull(filter: any, url: UrlBuilder) {
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key];
      if (isArray(element)) {
        if (element.length > 0 && isObject(element[0]))
          return false;
        if (element.length > 10)
          return false;
      }

    }
  }
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key];
      if (isArray(element)) {
        if (key.endsWith("_in"))
          url.add(key, JSON.stringify(element));
        else
          element.forEach(e => url.add(key, e));
      }
      else
        url.add(key, element);
    }
  }
  return true;
}
