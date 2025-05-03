import { TLSContext } from './stores/LSContext.js'
import { TSSContext } from './stores/SSContext.js'

export function getHeader(
  SSCtx: TSSContext,
  LSCtx: TLSContext,
  init?: RequestInit,
) {
  const headers = SSCtx.settings.bearerAuth
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

  if (!LSCtx.settings.customHeaders) {
    return headers
  }

  let customHeaders = {}
  try {
    customHeaders = JSON.parse(LSCtx.settings.customHeaders)
  } catch (error) {
    console.error(`With custom headers: "${LSCtx.settings.customHeaders}" 👇`)
    console.error(error)
  }

  return {
    ...headers,
    ...customHeaders,
  }
}
