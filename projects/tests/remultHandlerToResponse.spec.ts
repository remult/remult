import { expect, it, describe } from 'vitest'
import { remultHandlerToResponse } from '../core/server'

describe('remultHandlerToResponse', () => {
  it('should return 404', () => {
    const response = remultHandlerToResponse(undefined, undefined, '')
    expect(response.status).toBe(404)
  })

  it('should return json', async () => {
    const response = remultHandlerToResponse(
      {
        data: { ok: 'boss' },
        statusCode: 200,
      },
      undefined,
      '',
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(`{"ok":"boss"}`)
  })

  it('should return content', async () => {
    const response = remultHandlerToResponse(
      {
        content: 'yo',
        statusCode: 200,
      },
      undefined,
      '',
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(`yo`)
  })

  it('should return redirect', async () => {
    const response = remultHandlerToResponse(
      {
        redirectUrl: 'http://localhost:3000',
        statusCode: 303,
      },
      undefined,
      'http://localhost:3000',
    )
    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('http://localhost:3000/')
  })

  it('should return sse', async () => {
    const response = remultHandlerToResponse(undefined, new Response('sse'), '')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(`sse`)
  })
})
