import { DataProvider, DataProviderFactory, FindOptions } from './DataInterfaces';
export class RestDataProvider implements DataProviderFactory {
  public provideFor(name: string): DataProvider {
    throw new Error('Not implemented yet.');
  }
}
class ActualRestDataProvider implements DataProvider {

  constructor(private url: string) {

  }
  public find(options: FindOptions): Promise<Array<any>> {
    throw new Error('Not implemented yet.');
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

  });

}
function onSuccess(response: Response) {

  if (response.status >= 200 && response.status < 300)
    return response.json();
  else throw response;

}
function onError(error: any) {
  throw error;
}
class urlBuilder {
  constructor(public url: string) {
  }
  add(key: string, value: any) {
    if (value == undefined)
      return;
    if (this.url.indexOf('?') >= 0)
      this.url += '&';
    else
      this.url += '?';
    this.url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  addObject(object: any, suffix = '') {
    if (object != undefined)
      for (var key in object) {
        this.add(key + suffix, object[key]);
      }
  }
}
