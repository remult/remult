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
    // Only the first colon separates the name from the value
    const i = line.indexOf(':')
    const key = line.slice(0, i).trim()
    if (i === -1 || !key) return acc
    return { ...acc, [key]: line.slice(i + 1).trim() }
  }, {})

  return {
    ...headers,
    ...customHeaders,
  }
}
