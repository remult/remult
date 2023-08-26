import { Done } from './Done'
import { Remult } from '../context'

import { InMemoryDataProvider } from '../data-providers/in-memory-database'

import { Field, Entity, EntityBase, Fields } from '../remult3'
import { processHttpException, toPromise } from '../buildRestDataProvider'
import { describe, it, expect } from 'vitest'

describe('test exception', () => {
  it('test save exception', async () => {
    var mem = new InMemoryDataProvider()
    var c = new Remult()
    c.dataProvider = {
      getEntityDataProvider: (e) => {
        let r = mem.getEntityDataProvider(e)
        return {
          count: undefined,
          delete: undefined,
          find: undefined,
          insert: async (x) => {
            return toPromise(
              new Promise((res, err) => {
                err({
                  error: {
                    message: 'error',
                    modelState: {
                      id: 'error for id',
                    },
                  },
                })
              }),
            )
          },
          update: undefined,
        }
      },
      transaction: undefined,
    }

    var ok = new Done()
    let type = class extends EntityBase {
      id: string
    }
    Entity('test')(type)
    Fields.string()(type.prototype, 'id')
    var x = c.repo(type).create()
    try {
      await x._.save()
    } catch (err) {
      expect(x._.fields.id.error).toBe('error for id')
      expect(err.message).toBe('error')
      expect(err.modelState.id).toBe('error for id')
      ok.ok()
    }
    ok.test()
  })
})
function log(what) {
  return what
}
describe('angular http client exception ', () => {
  it('waiting for proxy to restart', async () => {
    let err = await processHttpException({
      headers: {
        normalizedNames: {},
        lazyUpdate: null,
      },
      status: 504,
      statusText: 'Gateway Timeout',
      url: 'http://localhost:4201/api/stam',
      ok: false,
      name: 'HttpErrorResponse',
      message:
        'Http failure response for http://localhost:4201/api/stam: 504 Gateway Timeout',
      error: 'Error occured while trying to proxy to: localhost:4201/api/stam',
    })
    expect(err).toEqual({
      message:
        'Error occured while trying to proxy to: localhost:4201/api/stam',

      httpStatusCode: 504,
    })
  })
  it('network disconnect', async () => {
    let err = await processHttpException({
      headers: {
        normalizedNames: {},
        lazyUpdate: null,
        headers: {},
      },
      status: 0,
      statusText: 'Unknown Error',
      url: 'api/stam',
      ok: false,
      name: 'HttpErrorResponse',
      message: 'Http failure response for api/stam: 0 Unknown Error',
      error: {
        isTrusted: true,
      },
    })
    expect(err).toEqual({
      message: 'Network Error',
      httpStatusCode: 0,
    })
  })
  it('Forbidden', async () => {
    let err = await processHttpException({
      headers: {
        normalizedNames: {},
        lazyUpdate: null,
      },
      status: 403,
      statusText: 'Forbidden',
      url: 'http://localhost:4201/api/stam',
      ok: false,
      name: 'HttpErrorResponse',
      message:
        'Http failure response for http://localhost:4201/api/stam: 403 Forbidden',
      error: 'Forbidden',
    })
    expect(err).toEqual({
      message: 'Forbidden',
      httpStatusCode: 403,
    })
  })
  it('syntax error', async () => {
    let err = await processHttpException({
      headers: {
        normalizedNames: {},
        lazyUpdate: null,
      },
      status: 400,
      statusText: 'Bad Request',
      url: 'http://localhost:4201/api/stam',
      ok: false,
      name: 'HttpErrorResponse',
      message:
        'Http failure response for http://localhost:4201/api/stam: 400 Bad Request',
      error: {
        message: "Cannot read property 'toString' of undefined",
        stack:
          "TypeError: Cannot read property 'toString' of undefined\n    at Object.saving (C:\\repos\\radweb\\dist\\test-angular\\test-angular\\src\\app\\products-test\\products.component.js:50:19)\n    at rowHelperImplementation.<anonymous> (C:\\repos\\radweb\\dist\\test-angular\\core\\src\\remult3\\RepositoryImplementation.js:648:44)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\repos\\radweb\\node_modules\\tslib\\tslib.js:114:62)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)",
      },
    })
    expect(err.message).toBe("Cannot read property 'toString' of undefined")
    expect(err.stack).toContain('toString')
  })
  it('validation error', async () => {
    let err = await processHttpException({
      headers: {
        normalizedNames: {},
        lazyUpdate: null,
      },
      status: 400,
      statusText: 'Bad Request',
      url: 'http://localhost:4201/api/stam',
      ok: false,
      name: 'HttpErrorResponse',
      message:
        'Http failure response for http://localhost:4201/api/stam: 400 Bad Request',
      error: {
        modelState: {
          name: 'name error',
        },
        message: 'Name: name error',
      },
    })
    expect(err).toEqual({
      modelState: {
        name: 'name error',
      },
      message: 'Name: name error',
      httpStatusCode: 400,
    })
  })
})

describe('fetch client exception ', () => {
  it('waiting for proxy to restart', async () => {
    let err = await processHttpException({
      message: 'Request failed with status code 504',
      name: 'Error',
      stack:
        'Error: Request failed with status code 504\n    at createError (http://localhost:4201/vendor.js:127382:15)\n    at settle (http://localhost:4201/vendor.js:94395:12)\n    at XMLHttpRequest.onloadend [as __zone_symbol__ON_PROPERTYloadend] (http://localhost:4201/vendor.js:42269:7)\n    at XMLHttpRequest.wrapFn (http://localhost:4201/polyfills.js:12099:39)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11742:31)\n    at Object.onInvokeTask (http://localhost:4201/vendor.js:73020:33)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11741:60)\n    at Zone.runTask (http://localhost:4201/polyfills.js:11514:47)\n    at ZoneTask.invokeTask [as invoke] (http://localhost:4201/polyfills.js:11823:34)\n    at invokeTask (http://localhost:4201/polyfills.js:12936:14)',
      isAxiosError: true,
      response: {
        data: 'Error occured while trying to proxy to: localhost:4201/api/stam',
      },
      config: {
        transitional: {
          silentJSONParsing: true,
          forcedJSONParsing: true,
          clarifyTimeoutError: false,
        },
        transformRequest: [null],
        transformResponse: [null],
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: 'post',
        url: 'api/stam',
        data: '{"id":"a0637d3c-405c-4d79-a473-a7d043aaebfd","name":"noam"}',
      },
      status: 504,
    })
    expect(err).toEqual({
      message:
        'Error occured while trying to proxy to: localhost:4201/api/stam',
      httpStatusCode: 504,
    })
  })
  it('network disconnect', async () => {
    let err = await processHttpException({
      message: 'Network Error',
      name: 'Error',
      stack:
        'Error: Network Error\n    at createError (http://localhost:4201/vendor.js:127382:15)\n    at XMLHttpRequest.handleError [as __zone_symbol__ON_PROPERTYerror] (http://localhost:4201/vendor.js:42320:14)\n    at XMLHttpRequest.wrapFn (http://localhost:4201/polyfills.js:12099:39)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11742:31)\n    at Object.onInvokeTask (http://localhost:4201/vendor.js:73020:33)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11741:60)\n    at Zone.runTask (http://localhost:4201/polyfills.js:11514:47)\n    at ZoneTask.invokeTask [as invoke] (http://localhost:4201/polyfills.js:11823:34)\n    at invokeTask (http://localhost:4201/polyfills.js:12936:14)\n    at XMLHttpRequest.globalZoneAwareCallback (http://localhost:4201/polyfills.js:12962:17)',
      isAxiosError: true,
      response: undefined,
      config: {
        transitional: {
          silentJSONParsing: true,
          forcedJSONParsing: true,
          clarifyTimeoutError: false,
        },
        transformRequest: [null],
        transformResponse: [null],
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: 'post',
        url: 'api/stam',
        data: '{"id":"fa1cf12e-7049-4b95-bf81-665de4a263bb","name":"noam"}',
      },
      status: null,
    })
    expect(err).toEqual({
      message: 'Network Error',
    })
  })
  it('Forbidden', async () => {
    let err = await processHttpException({
      message: 'Request failed with status code 403',
      name: 'Error',
      stack:
        'Error: Request failed with status code 403\n    at createError (http://localhost:4201/vendor.js:127382:15)\n    at settle (http://localhost:4201/vendor.js:94395:12)\n    at XMLHttpRequest.onloadend [as __zone_symbol__ON_PROPERTYloadend] (http://localhost:4201/vendor.js:42269:7)\n    at XMLHttpRequest.wrapFn (http://localhost:4201/polyfills.js:12099:39)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11742:31)\n    at Object.onInvokeTask (http://localhost:4201/vendor.js:73020:33)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11741:60)\n    at Zone.runTask (http://localhost:4201/polyfills.js:11514:47)\n    at ZoneTask.invokeTask [as invoke] (http://localhost:4201/polyfills.js:11823:34)\n    at invokeTask (http://localhost:4201/polyfills.js:12936:14)',
      isAxiosError: true,
      response: {
        data: 'Forbidden',
      },
      config: {
        transitional: {
          silentJSONParsing: true,
          forcedJSONParsing: true,
          clarifyTimeoutError: false,
        },
        transformRequest: [null],
        transformResponse: [null],
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: 'post',
        url: 'api/stam',
        data: '{"id":"6a896b08-de4a-451a-9905-bf17c7690f78","name":"noam"}',
      },
      status: 403,
    })
    expect(err).toEqual({
      message: 'Forbidden',
      httpStatusCode: 403,
    })
  })
  it('syntax error', async () => {
    let err = await processHttpException({
      message: 'Request failed with status code 400',
      name: 'Error',
      stack:
        'Error: Request failed with status code 400\n    at createError (http://localhost:4201/vendor.js:127382:15)\n    at settle (http://localhost:4201/vendor.js:94395:12)\n    at XMLHttpRequest.onloadend [as __zone_symbol__ON_PROPERTYloadend] (http://localhost:4201/vendor.js:42269:7)\n    at XMLHttpRequest.wrapFn (http://localhost:4201/polyfills.js:12099:39)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11742:31)\n    at Object.onInvokeTask (http://localhost:4201/vendor.js:73020:33)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11741:60)\n    at Zone.runTask (http://localhost:4201/polyfills.js:11514:47)\n    at ZoneTask.invokeTask [as invoke] (http://localhost:4201/polyfills.js:11823:34)\n    at invokeTask (http://localhost:4201/polyfills.js:12936:14)',
      isAxiosError: true,
      response: {
        data: {
          message: "Cannot read property 'toString' of undefined",
          stack:
            "TypeError: Cannot read property 'toString' of undefined\n    at Object.saving (C:\\repos\\radweb\\dist\\test-angular\\test-angular\\src\\app\\products-test\\products.component.js:51:19)\n    at rowHelperImplementation.<anonymous> (C:\\repos\\radweb\\dist\\test-angular\\core\\src\\remult3\\RepositoryImplementation.js:648:44)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\repos\\radweb\\node_modules\\tslib\\tslib.js:114:62)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)",
        },
      },
      config: {
        transitional: {
          silentJSONParsing: true,
          forcedJSONParsing: true,
          clarifyTimeoutError: false,
        },
        transformRequest: [null],
        transformResponse: [null],
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: 'post',
        url: 'api/stam',
        data: '{"id":"e53e981d-4339-4d92-bb6b-18c6dfb3a9bb","name":"noam"}',
      },
      status: 400,
    })
    expect(err.message).toBe("Cannot read property 'toString' of undefined")
    expect(err.stack).toContain('toString')
  })
  it('validation error', async () => {
    let err = await processHttpException({
      message: 'Request failed with status code 400',
      name: 'Error',
      stack:
        'Error: Request failed with status code 400\n    at createError (http://localhost:4201/vendor.js:127382:15)\n    at settle (http://localhost:4201/vendor.js:94395:12)\n    at XMLHttpRequest.onloadend [as __zone_symbol__ON_PROPERTYloadend] (http://localhost:4201/vendor.js:42269:7)\n    at XMLHttpRequest.wrapFn (http://localhost:4201/polyfills.js:12099:39)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11742:31)\n    at Object.onInvokeTask (http://localhost:4201/vendor.js:73020:33)\n    at ZoneDelegate.invokeTask (http://localhost:4201/polyfills.js:11741:60)\n    at Zone.runTask (http://localhost:4201/polyfills.js:11514:47)\n    at ZoneTask.invokeTask [as invoke] (http://localhost:4201/polyfills.js:11823:34)\n    at invokeTask (http://localhost:4201/polyfills.js:12936:14)',
      isAxiosError: true,
      response: {
        data: {
          modelState: {
            name: 'name error',
          },
          message: 'Name: name error',
        },
      },
      config: {
        transitional: {
          silentJSONParsing: true,
          forcedJSONParsing: true,
          clarifyTimeoutError: false,
        },
        transformRequest: [null],
        transformResponse: [null],
        timeout: 0,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: -1,
        maxBodyLength: -1,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        method: 'post',
        url: 'api/stam',
        data: '{"id":"d4c16ebf-5d9b-4eff-98cd-1c3f26d6aa08","name":"noam"}',
      },
      status: 400,
    })

    expect(err).toEqual({
      modelState: {
        name: 'name error',
      },
      message: 'Name: name error',
      httpStatusCode: 400,
    })
  })
})
