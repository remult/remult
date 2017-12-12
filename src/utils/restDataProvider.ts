import { Sort, Column } from './utils';
import { DataProvider, DataProviderFactory, FindOptions } from './DataInterfaces';
export class RestDataProvider implements DataProviderFactory {
  constructor(private url: string) {

  }
  public provideFor(name: string): DataProvider {
    return new ActualRestDataProvider(this.url + '/' + name);
  }
}
class ActualRestDataProvider implements DataProvider {

  constructor(private url: string) {

  }
  public find(options: FindOptions): Promise<Array<any>> {
    let url = new UrlBuilder(this.url);
    if (options) {
      if (options.where) {
        options.where.__addToUrl((col, val) => url.add(col.jsonName, val));
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
    }
    
    if (options.additionalUrlParameters)
      url.addObject(options.additionalUrlParameters);
    return myFetch(url.url).then(r => {
      return r;
    });
  }

  public update(id: any, data: any): Promise<any> {
    let h = new Headers();
    h.append('Content-type', "application/json");
    return myFetch(this.url + '/' + id, {
      method: 'put',
      headers: h,
      body: JSON.stringify(data)
    })
  }

  public delete(id: any): Promise<void> {
    return fetch(this.url + '/' + id, { method: 'delete', credentials: 'include' }).then(() => { }, onError);
  }

  public insert(data: any): Promise<any> {
    let h = new Headers();
    h.append('Content-type', "application/json");
    return myFetch(this.url, {
      method: 'post',
      headers: h,
      body: JSON.stringify(data)
    })
  }
}

function myFetch(url: string, init?: RequestInit): Promise<any> {
  if (!init)
    init = {};
  init.credentials = 'include';
  return fetch(url, init).then(onSuccess, error => {
    throw Promise.resolve(error);
  });

}
function onSuccess(response: Response) {

  if (response.status >= 200 && response.status < 300)
    return response.json();
  else throw response.json();

}
function onError(error: any) {
  throw error;
}
class UrlBuilder {
  constructor(public url: string) {
  }
  add(key: string, value: any) {
    if (this.url.indexOf('?') >= 0)
      this.url += '&';
    else
      this.url += '?';
    this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  addObject(object: any, suffix = '') {
    if (object != undefined)
      for (var key in object) {
        let val = object[key];
        if (val instanceof Column)
          val = val.value;
        this.add(key + suffix, val);
      }
  }
}
