

import { EntityDataProvider, DataProvider, EntityDataProviderFindOptions, RestDataProviderHttpProvider } from '../data-interfaces';

import { UrlBuilder } from '../../urlBuilder';
import { customUrlToken, Filter } from '../filter/filter-interfaces';
import { EntityMetadata, FindOptions } from '../remult3';
import { ApiClient, buildRestDataProvider, Remult, retry } from '../context';
import { Sort } from '../sort';


export class RestDataProvider implements DataProvider {
  constructor(
    private apiProvider: () => ApiClient
  ) {

  }
  public getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {

    return new RestEntityDataProvider(() => {
      let url = this.apiProvider()?.url;
      if (url === undefined || url === null)
        url = '/api';
      return url + '/' + entity.key
    },
      () => {
        return buildRestDataProvider(this.apiProvider().httpClient);
      }, entity);
  }
  async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  supportsCustomFilter = true;

}

export function findOptionsToJson(options: FindOptions<any>, meta: EntityMetadata) {
  return {
    limit: options.limit,
    page: options.page,
    where: Filter.entityFilterToJson(meta, options.where),
    orderBy: options.orderBy
  };
}
export function findOptionsFromJson(json: any, meta: EntityMetadata): FindOptions<any> {
  return {
    limit: json.limit,
    page: json.page,
    where: Filter.entityFilterFromJson(meta, json.where),
    orderBy: json.orderBy
  };
}


export class RestEntityDataProvider implements EntityDataProvider {

  constructor(private url: () => string, private http: () => RestDataProviderHttpProvider, private entity: EntityMetadata) {

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
    let url = new UrlBuilder(this.url());
    url.add("__action", "count");
    let filterObject: any;

    if (where) {
      filterObject = where.toJson();
      if (addFilterToUrlAndReturnTrueIfSuccessful(filterObject, url))
        filterObject = undefined;
    }
    if (filterObject)
      return this.http().post(url.url, filterObject).then(r => +(r.count));
    else
      return this.http().get(url.url).then(r => +(r.count));
  }
  public find(options: EntityDataProviderFindOptions): Promise<Array<any>> {
    let { filterObject, url } = this.buildFindRequest(options);

    if (filterObject) {
      url.add("__action", "get");
      return this.http().post(url.url, filterObject).then(x => x.map(y => this.translateFromJson(y)));
    }
    else
      return this.http().get(url.url).then(x => x.map(y => this.translateFromJson(y)));;
  }

  buildFindRequest(options: EntityDataProviderFindOptions): { filterObject: any; url: UrlBuilder; } {
    let url = new UrlBuilder(this.url());
    let filterObject: any;
    if (options) {
      if (options.where) {

        filterObject = options.where.toJson(); //        options.where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
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
    return { filterObject, url };
  }

  public update(id: any, data: any): Promise<any> {
    let result = {};
    let keys = Object.keys(data);
    for (const col of this.entity.fields) {
      if (keys.includes(col.key))
        result[col.key] = col.valueConverter.toJson(data[col.key]);
    }

    return this.http().put(this.url() + '/' + encodeURIComponent(id), result).then(y => this.translateFromJson(y));

  }

  public delete(id: any): Promise<void> {
    return this.http().delete(this.url() + '/' + encodeURIComponent(id));
  }

  public insert(data: any): Promise<any> {
    return this.http().post(this.url(), this.translateToJson(data)).then(y => this.translateFromJson(y));
  }
}

export class RestDataProviderHttpProviderUsingFetch implements RestDataProviderHttpProvider {
  constructor(private fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>) {
  }
  async get(url: string) {
    return await retry(async () => this.myFetch(url).then(r => {
      return r;
    }));
  }
  put(url: string, data: any) {
    return this.myFetch(url, {
      method: 'put',
      body: JSON.stringify(data)
    })
  }
  delete(url: string) {

    return this.myFetch(url, { method: 'delete' });
  }
  async post(url: string, data: any) {

    return await retry(() => this.myFetch(url, {
      method: 'post',
      body: JSON.stringify(data)
    }));
  }

  myFetch(url: string, options?: {
    method?: string,
    body?: string,
  }): Promise<any> {

    const headers = {
      "Content-type": "application/json"
    }
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof (window.document.cookie !== 'undefined'))
      for (const cookie of window.document.cookie.split(';')) {
        if (cookie.trim().startsWith('XSRF-TOKEN=')) {
          headers['X-XSRF-TOKEN'] = cookie.split('=')[1];
        }
      }
    return (this.fetch || fetch)(url, {
      credentials: 'include',
      method: options?.method,
      body: options?.body,
      headers
    }).then(response => {

      return onSuccess(response);

    }).catch(async error => {
      let r = await error;
      throw r;
    });
  }

}

function onSuccess(response: Response) {
  if (response.status == 204)
    return;
  if (response.status >= 200 && response.status < 300)

    return response.json();
  else {
    throw response.json().then(x => {
      return { ...x, message: x.message || response.statusText, url: response.url, status: response.status };
    }).catch(() => {
      throw {
        message: response.statusText,
        url: response.url,
        status: response.status

      };
    })
  }
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
        if (key.startsWith(customUrlToken))
          url.add(key, JSON.stringify(element));
        else
          url.add(key, element);
    }
  }
  return true;
}
