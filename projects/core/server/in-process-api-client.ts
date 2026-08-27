import { remult } from '../index.js'
import type { ApiClient } from '../src/context.js'
import { buildInProcessRequest } from './in-process-request.js'
import type { RemultServer } from './remult-api-server.js'

/**
 * An http client that hands the request to the api mounted in this process
 * instead of the network - same server, same routes, same rules, minus the
 * roundtrip. The user comes from the ambient remult, since there is no framework
 * request to read it from.
 */
export function buildInProcessHttpClient<RequestType>(
  server: RemultServer<RequestType>,
): NonNullable<ApiClient['httpClient']> {
  const call = async (method: string, url: string, body?: any) => {
    const result = await server.handle(
      buildInProcessRequest({
        url,
        method,
        body,
        user: remult.user ? { ...remult.user } : undefined,
      }) as RequestType,
    )
    if ((result?.statusCode ?? 200) >= 400)
      throw { ...result?.data, status: result?.statusCode ?? 500 }
    // the wire would have done it, and the caller must not reach the server's own rows
    return result?.data ? JSON.parse(JSON.stringify(result.data)) : undefined
  }

  return {
    get: (url) => call('GET', url),
    put: (url, body) => call('PUT', url, body),
    post: (url, body) => call('POST', url, body),
    delete: (url) => call('DELETE', url),
  }
}
