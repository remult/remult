
import { UrlBuilder, FilterConsumnerBridgeToUrlBuilder } from './utils';
import { DataProvider, DataProviderFactory, FindOptions, DataApiRequest, FilterBase } from './dataInterfaces1';
import { DataApiResponse } from '../server/DataApi';
import { HttpClient } from '@angular/common/http';

export class RestDataProvider implements DataProviderFactory {
  constructor(private url: string, private http: restDataProviderHttpProvider) {

  }
  public provideFor(name: string): DataProvider {
    return new ActualRestDataProvider(this.url + '/' + name, this.http);
  }
}
class ActualRestDataProvider implements DataProvider {

  constructor(private url: string, private http: restDataProviderHttpProvider) {

  }

  public count(where: FilterBase): Promise<number> {
    let url = new UrlBuilder(this.url);
    url.add("__action", "count");
    if (where) {
      where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
    }
    return this.http.get(url.url).then(r => +(r.count));
  }
  public find(options: FindOptions): Promise<Array<any>> {
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
          sort += c.column.jsonName;
          order += c.descending ? "desc" : "asc";

        });
        url.add('_sort', sort);
        url.add('_order', order);
      }
      if (options.limit)
        url.add('_limit', options.limit);
      if (options.page)
        url.add('_page', options.page);
      if (options.additionalUrlParameters)
        url.addObject(options.additionalUrlParameters);
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

export interface restDataProviderHttpProvider {
  post(url: string, data: any): Promise<any>;
  delete(url: string): Promise<void>;
  put(url: string, data: any): Promise<any>;
  get(url: string): Promise<any>;

}
export class angularHttpProvider implements restDataProviderHttpProvider {
  constructor(private http: HttpClient) {

  }
  post(url: string, data: any): Promise<any> {
    return this.http.post(url, data).toPromise();
  }
  delete(url: string): Promise<void> {
    return this.http.delete(url).toPromise().then(x => { });
  }
  put(url: string, data: any): Promise<any> {
    return this.http.put(url, data).toPromise();
  }
  get(url: string): Promise<any> {
    return this.http.get(url).toPromise();
  }


}


export class restDataProviderHttpProviderUsingFetch implements restDataProviderHttpProvider {
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
export interface WrapFetchInterface {
  wrap: () => (() => void);
}
export const wrapFetch: WrapFetchInterface = {
  wrap: () => () => { }
};
export function myFetch(url: string, init: RequestInit, ...addRequestHeader: ((add: ((name: string, value: string) => void)) => void)[]): Promise<any> {
  if (!init)
    init = {};
  if (!init.headers)
    init.headers = new Headers();
  var h = init.headers as Headers;
  addRequestHeader.forEach(x => x((n, v) => h.append(n, v)));
  init.credentials = 'include';
  let x = wrapFetch.wrap();
  return fetch(url, init).then(response => {
    x();
    return onSuccess(response);

  }, error => {
    console.log(error);
    x();
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


 export abstract class Action<inParam, outParam>{
  constructor(private serverUrl: string, private actionUrl?: string, addRequestHeader?: (add: ((name: string, value: string) => void)) => void) {
    if (!addRequestHeader)
      addRequestHeader = () => { };
    if (!actionUrl) {
      this.actionUrl = this.constructor.name;
      if (this.actionUrl.endsWith('Action'))
        this.actionUrl = this.actionUrl.substring(0, this.actionUrl.length - 6);
    }
  }
  static provider: restDataProviderHttpProvider = new restDataProviderHttpProviderUsingFetch();
  run(pIn: inParam): Promise<outParam> {

    return Action.provider.post(this.serverUrl + this.actionUrl, pIn);


  }
  protected abstract execute(info: inParam, req: DataApiRequest): Promise<outParam>;

  __register(reg: (url: string, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {
    reg(this.actionUrl, async (d, req, res) => {

      try {
        var r = await this.execute(d, req);
        res.success(r);
      }
      catch (err) {
        res.error(err);
      }

    });
  }
}
