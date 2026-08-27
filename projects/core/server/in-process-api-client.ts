import type { DataProvider } from '../index.js'
import { remult } from '../index.js'
import type { ApiClient } from '../src/context.js'
import type { RemultServerOptions } from './index.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
  type RemultServerImplementation,
} from './remult-api-server.js'

type InProcessRequest = GenericRequestInfo & { body?: any; user?: any }

/**
 * An http client that runs the request through this process' api pipeline instead
 * of the network - same entities, controllers and data provider as the mounted
 * api, so every api rule applies, minus the roundtrip.
 *
 * It needs a second server because the mounted one speaks its framework's request
 * type; this one speaks `{ url, method, body }`.
 */
export function buildInProcessHttpClient<RequestType>(
  options: RemultServerOptions<RequestType>,
  dataProvider: Promise<DataProvider>,
): NonNullable<ApiClient['httpClient']> {
  let server: RemultServerImplementation<InProcessRequest> | undefined

  const call = async (method: string, url: string, body?: any) => {
    if (!server)
      server = createRemultServerCore<InProcessRequest>(
        {
          ...(options as RemultServerOptions<InProcessRequest>),
          dataProvider,
          // the mounted api already ensured it, and its initApi already ran
          ensureSchema: false,
          initApi: undefined,
          logApiEndPoints: false,
          // the caller is already authenticated, the framework request is gone
          getUser: async (req) => req.user,
        },
        {
          getRequestBody: async (req) => req.body,
          buildGenericRequestInfo: (req) => ({
            internal: req,
            public: { headers: new Headers() },
          }),
          ignoreAsyncStorage: true,
        },
      ) as RemultServerImplementation<InProcessRequest>

    const result = await server.handle({
      url,
      method,
      body,
      user: remult.user ? { ...remult.user } : undefined,
    })
    if ((result?.statusCode ?? 200) >= 400)
      throw { ...result?.data, status: result?.statusCode ?? 500 }
    // the wire would have done it, and callers must not reach the server's rows
    return result?.data ? JSON.parse(JSON.stringify(result.data)) : undefined
  }

  return {
    get: (url) => call('GET', url),
    put: (url, body) => call('PUT', url, body),
    post: (url, body) => call('POST', url, body),
    delete: (url) => call('DELETE', url),
  }
}
