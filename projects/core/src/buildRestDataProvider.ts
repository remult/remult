import type { RestDataProviderHttpProvider } from './data-interfaces.js'
import { RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider-using-fetch.js'
import { retry } from './data-providers/retry.js'


export function buildRestDataProvider(
  provider: ExternalHttpProvider | typeof fetch | undefined,
): RestDataProviderHttpProvider {
  if (!provider) return new RestDataProviderHttpProviderUsingFetch()
  let httpDataProvider: RestDataProviderHttpProvider | undefined

  if (!httpDataProvider) {
    if (isExternalHttpProvider(provider)) {
      httpDataProvider = new HttpProviderBridgeToRestDataProviderHttpProvider(
        provider as ExternalHttpProvider,
      )
    }
  }
  if (!httpDataProvider) {
    if (typeof provider === 'function') {
      httpDataProvider = new RestDataProviderHttpProviderUsingFetch(provider)
    }
  }
  return httpDataProvider!
}

export function isExternalHttpProvider(item: any) {
  let http: ExternalHttpProvider = item as ExternalHttpProvider
  if (http && http.get! && http.put! && http.post! && http.delete!) return true
  return false
}
export class HttpProviderBridgeToRestDataProviderHttpProvider
  implements RestDataProviderHttpProvider {
  constructor(private http: ExternalHttpProvider) { }
  async post(url: string, data: any): Promise<any> {
    return await retry(() => toPromise(this.http.post(url, data)))
  }
  delete(url: string): Promise<void> {
    return toPromise(this.http.delete(url))
  }
  put(url: string, data: any): Promise<any> {
    return toPromise(this.http.put(url, data))
  }
  async get(url: string): Promise<any> {
    return await retry(() => toPromise(this.http.get(url)))
  }
}


export function toPromise<T>(p: Promise<T> | { toPromise(): Promise<T> }) {
  let r: Promise<T>
  if ((p as any)['toPromise'] !== undefined) {
    r = (p as any)['toPromise']()
  }
  //@ts-ignore
  else r = p
  return r
    .then((x: any) => {
      if (
        x &&
        (x.status == 200 || x.status == 201) &&
        x.headers &&
        x.request &&
        x.data !== undefined
      )
        //for axios
        return x.data
      return x
    })
    .catch(async (ex) => {
      throw await processHttpException(ex)
    })
}

export async function processHttpException(ex: any) {
  let z = await ex
  var error
  if (z.error) error = z.error
  else if (z.isAxiosError) {
    if (typeof z.response?.data === 'string') error = z.response.data
    else error = z?.response?.data
  }
  if (!error) error = z.message
  if (z.status == 0 && z.error.isTrusted) error = 'Network Error'
  if (typeof error === 'string') {
    error = {
      message: error,
    }
  }
  if (z.modelState) error.modelState = z.modelState
  let httpStatusCode = z.status
  if (httpStatusCode === undefined) httpStatusCode = z.response?.status
  if (httpStatusCode !== undefined && httpStatusCode !== null) {
    error.httpStatusCode = httpStatusCode
  }
  var result = Object.assign(error ?? {}, {
    //     exception: ex disabled for now because JSON.stringify crashed with this
  })
  return result
}

export interface ExternalHttpProvider {
  post(url: string, data: any): Promise<any> | { toPromise(): Promise<any> }
  delete(url: string): Promise<void> | { toPromise(): Promise<void> }
  put(url: string, data: any): Promise<any> | { toPromise(): Promise<any> }
  get(url: string): Promise<any> | { toPromise(): Promise<any> }
}
