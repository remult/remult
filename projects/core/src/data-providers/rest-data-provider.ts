

import { EntityDataProvider, DataProvider, EntityDataProviderFindOptions } from '../data-interfaces';
import { Entity } from '../entity';
import { FilterConsumnerBridgeToUrlBuilder } from '../filter/filter-consumer-bridge-to-url-builder';
import { UrlBuilder } from '../url-builder';
import { FilterBase } from '../filter/filter-interfaces';

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

  public count(where: FilterBase): Promise<number> {
    let url = new UrlBuilder(this.url);
    url.add("__action", "count");
    if (where) {
      where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
    }
    return this.http.get(url.url).then(r => +(r.count));
  }
  public find(options: EntityDataProviderFindOptions): Promise<Array<any>> {
    let url = new UrlBuilder(this.url);
    if (options) {
      if (options.where) {
        options.where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
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

  }, error => {
    console.log(error);
    throw Promise.resolve(error);
  });
}
function onSuccess(response: Response) {
  if (response.status == 204)
    return;
  if (response.status >= 200 && response.status < 300)

    return response.json();
  else
    throw response.json().then(x => {

      if (!x.message)
        x.message = response.statusText;
      return x;
    });



}
function onError(error: any) {
  throw Promise.resolve(error);
}


