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

  const customHeaders = (LSCtx.settings.customHeaders ?? '').split('\n').reduce((acc, line) => {
    const [key, value] = line.split(':').map(part => part.trim())
    return { ...acc, [key]: value }
  }, {})

  return {
    ...headers,
    ...customHeaders,
  }
}
