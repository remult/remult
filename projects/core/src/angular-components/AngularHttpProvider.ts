import { HttpClient } from '@angular/common/http';
import { RestDataProviderHttpProvider } from '../core/data-providers/restDataProvider';
export class AngularHttpProvider implements RestDataProviderHttpProvider {
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
