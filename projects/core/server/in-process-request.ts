import type { UserInfo } from '../src/context.js'
import type { GenericRequest, GenericRequestInfo } from './remult-api-server.js'

const inProcessRequest = Symbol.for('remult-in-process-request')

/**
 * A request that skips the framework adapter, so the api that is already mounted
 * can serve an in-process call instead of a second server being stood up for it.
 */
export type InProcessRequest = GenericRequestInfo & {
  [inProcessRequest]: true
  body?: any
  user?: UserInfo
}

export function buildInProcessRequest(req: {
  url: string
  method: string
  body?: any
  user?: UserInfo
}): InProcessRequest {
  return { ...req, [inProcessRequest]: true }
}

export function isInProcessRequest(req: any): req is InProcessRequest {
  return req?.[inProcessRequest] === true
}

export function inProcessRequestInfo(req: InProcessRequest): {
  internal: GenericRequestInfo
  public: GenericRequest
} {
  return { internal: req, public: { headers: new Headers() } }
}
