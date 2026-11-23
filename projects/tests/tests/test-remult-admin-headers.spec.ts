import { describe, expect, it } from 'vitest'
import { getHeader } from '../../remult-admin/src/lib/helper'

const headersFor = (customHeaders: string) =>
  new Headers(
    getHeader(
      { settings: { bearerAuth: '' } } as any,
      { settings: { keyForBearerAuth: '', customHeaders } } as any,
    ),
  )

describe('remult-admin custom headers', () => {
  it('should keep colons in the value', () => {
    const headers = headersFor('X-Origin: http://localhost:3000\nX-Tenant: a:b')
    expect(headers.get('X-Origin')).toBe('http://localhost:3000')
    expect(headers.get('X-Tenant')).toBe('a:b')
  })

  it('should ignore lines that are not headers', () => {
    const headers = headersFor('X-Tenant: a\n\nnot a header\n: b\n')
    expect([...headers]).toEqual([['x-tenant', 'a']])
  })
})
