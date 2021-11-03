

import { EntityDataProvider, DataProvider, EntityDataProviderFindOptions, RestDataProviderHttpProvider } from '../data-interfaces';

import { UrlBuilder } from '../../urlBuilder';
import { customUrlToken, Filter } from '../filter/filter-interfaces';
import { EntityMetadata } from '../remult3';


export class RestDataProvider implements DataProvider {
  constructor(private url: string, private http: RestDataProviderHttpProvider) {

  }
  public getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    return new RestEntityDataProvider(this.url + '/' + entity.key, this.http, entity);
  }
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  supportsCustomFilter = true;

}
export class RestEntityDataProvider implements EntityDataProvider {

  constructor(private url: string, private http: RestDataProviderHttpProvider, private entity: EntityMetadata) {

  }
  translateFromJson(row: any) {
    let result = {};
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.fromJson(row[col.key]);
    }
    return result;
  }
  translateToJson(row: any) {
    let result = {};
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.toJson(row[col.key]);
    }
    return result;
  }

  public async count(where: Filter): Promise<number> {
    let url = new UrlBuilder(this.url);
    url.add("__action", "count");
    let filterObject: any;

    if (where) {
      filterObject = where.toJson();
      if (addFilterToUrlAndReturnTrueIfSuccessful(filterObject, url))
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

        filterObject = options.where.toJson();//        options.where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
        if (addFilterToUrlAndReturnTrueIfSuccessful(filterObject, url))
          filterObject = undefined;
      }
      if (options.orderBy && options.orderBy.Segments) {
        let sort = '';
        let order = '';
        options.orderBy.Segments.forEach(c => {
          if (sort.length > 0) {
            sort += ",";
            order += ",";
          }
          sort += c.field.key;
          order += c.isDescending ? "desc" : "asc";

        });
        url.add('_sort', sort);
        url.add('_order', order);
      }
      if (options.limit)
        url.add('_limit', options.limit);
      if (options.page)
        url.add('_page', options.page);
      
    }
    if (filterObject) {
      url.add("__action", "get");
      return this.http.post(url.url, filterObject).then(x => x.map(y => this.translateFromJson(y)));
    }
    else
      return this.http.get(url.url).then(x => x.map(y => this.translateFromJson(y)));;
  }

  public update(id: any, data: any): Promise<any> {
    let result = {};
    let keys  =Object.keys(data);
    for (const col of this.entity.fields) {
      if (keys.includes(col.key))
        result[col.key] = col.valueConverter.toJson(data[col.key]);
    }

    return this.http.put(this.url + '/' + encodeURIComponent(id), result).then(y => this.translateFromJson(y));

  }

  public delete(id: any): Promise<void> {
    return this.http.delete(this.url + '/' + encodeURIComponent(id));
  }

  public insert(data: any): Promise<any> {
    return this.http.post(this.url, this.translateToJson(data)).then(y => this.translateFromJson(y));
  }
}
function JsonContent(add: (name: string, value: string) => void) {
  add('Content-type', "application/json");
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

export function addFilterToUrlAndReturnTrueIfSuccessful(filter: any, url: UrlBuilder) {
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key];
      if (Array.isArray(element)) {
        if (element.length > 0 && typeof element[0] === 'object')
          return false;
        if (element.length > 10)
          return false;
      }

    }
  }
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key];
      if (Array.isArray(element)) {
        if (key.endsWith("_in"))
          url.add(key, JSON.stringify(element));

        else
          element.forEach(e => url.add(key, e));
      }
      else
        if (key .startsWith(customUrlToken))
          url.add(key, JSON.stringify(element));
        else
          url.add(key, element);
    }
  }
  return true;
}
