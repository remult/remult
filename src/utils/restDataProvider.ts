
import { Sort, Column, UrlBuilder, FilterConsumnerBridgeToUrlBuilder } from './utils';
import { DataProvider, DataProviderFactory, FindOptions, DataApiRequest } from './DataInterfaces';
import { DataApiResponse } from '../utils/server/DataApi';

export class RestDataProvider implements DataProviderFactory {
  constructor(private url: string, private addRequestHeader?: (add: ((name: string, value: string) => void)) => void) {

  }
  public provideFor(name: string): DataProvider {
    return new ActualRestDataProvider(this.url + '/' + name, this.addRequestHeader);
  }
}
class ActualRestDataProvider implements DataProvider {

  constructor(private url: string, private addRequestHeader: (add: ((name: string, value: string) => void)) => void) {
    if (!addRequestHeader)
      this.addRequestHeader = () => { };
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

    return myFetch(url.url, undefined, this.addRequestHeader).then(r => {
      return r;
    });
  }

  public update(id: any, data: any): Promise<any> {
    return myFetch(this.url + '/' + id, {
      method: 'put',
      body: JSON.stringify(data)
    }, this.addRequestHeader, JsonContent)
  }

  public delete(id: any): Promise<void> {
    let h = new Headers();
    this.addRequestHeader((name, value) => h.append(name, value));
    return fetch(this.url + '/' + id, { method: 'delete', credentials: 'include', headers: h }).then(onSuccess, onError);
  }

  public insert(data: any): Promise<any> {
    return myFetch(this.url, {
      method: 'post',
      body: JSON.stringify(data)
    }, this.addRequestHeader, JsonContent)
  }
}
function JsonContent(add: (name: string, value: string) => void) {
  add('Content-type', "application/json");
}

export function myFetch(url: string, init: RequestInit, ...addRequestHeader: ((add: ((name: string, value: string) => void)) => void)[]): Promise<any> {
  if (!init)
    init = {};
  if (!init.headers)
    init.headers = new Headers();
  var h = init.headers as Headers;
  addRequestHeader.forEach(x => x((n, v) => h.append(n, v)));
  init.credentials = 'include';
  return fetch(url, init).then(onSuccess, error => {
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
      console.log(x);
      if (!x.message)
        x.message = response.statusText;
      return x;
    });



}
function onError(error: any) {
  throw Promise.resolve(error);
}


export abstract class Action<inParam, outParam>{
  constructor(private serverUrl: string, private actionUrl?: string, private addRequestHeader?: (add: ((name: string, value: string) => void)) => void) {
    if (!addRequestHeader)
      this.addRequestHeader = () => { };
    if (!actionUrl) {
      this.actionUrl = this.constructor.name;
      if (this.actionUrl.endsWith('Action'))
        this.actionUrl = this.actionUrl.substring(0, this.actionUrl.length - 6);
    }
  }
  run(pIn: inParam): Promise<outParam> {


    return myFetch(this.serverUrl + this.actionUrl, {
      method: 'post',
      body: JSON.stringify(pIn)
    }, this.addRequestHeader, JsonContent);

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
