import { TLSContext } from './stores/LSContext.js'
import { TSSContext } from './stores/SSContext.js'

export function getHeader(
  SSCtx: TSSContext,
  LSCtx: TLSContext,
  init?: RequestInit,
) {
  return SSCtx.settings.bearerAuth
    ? {
        ...init?.headers,
        authorization: 'Bearer ' + SSCtx.settings.bearerAuth,
      }
    : LSCtx.settings.keyForBearerAuth
    ? {
        ...init?.headers,
        authorization:
          'Bearer ' + localStorage.getItem(LSCtx.settings.keyForBearerAuth),
      }
    : init?.headers
}
