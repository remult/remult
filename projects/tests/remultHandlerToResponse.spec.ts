import { remultHandlerToResponse } from '../core/server/remultHandlerToResponse.js'
import { describe, it, expect } from 'vitest'

describe('remultHandlerToResponse', () => {
  it('should return a response', () => {
    const response = remultHandlerToResponse(undefined, undefined, undefined)
    expect(response).toBeDefined()
  })

  it('should return sse part', async () => {
    const response = remultHandlerToResponse(
      undefined,
      new Response('sse response'),
      undefined,
    )
    expect(await response.text()).toMatchInlineSnapshot(`"sse response"`)
  })

  it('should return 404', async () => {
    const response = remultHandlerToResponse(
      {
        statusCode: 404,
      },
      undefined,
      undefined,
    )
    expect(response.status).toBe(404)
  })

  it('should return 407', async () => {
    const response = remultHandlerToResponse(
      {
        statusCode: 407,
      },
      undefined,
      undefined,
    )
    expect(response.status).toBe(407)
  })

  it('should return html with text/html', async () => {
    const response = remultHandlerToResponse(
      {
        html: 'html response',
        statusCode: 200,
      },
      undefined,
      undefined,
    )
    expect(await response.text()).toBe('html response')
    expect(response.headers.get('Content-Type')).toBe('text/html')
  })

  it('should return data with application/json', async () => {
    const data = { plop: 'hello' }
    const response = remultHandlerToResponse(
      {
        data,
        statusCode: 200,
      },
      undefined,
      undefined,
    )
    expect(await response.json()).toMatchObject(data)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should redirect', async () => {
    const response = remultHandlerToResponse(
      {
        redirectUrl: 'https://www.google.com/',
        statusCode: 302,
      },
      undefined,
      undefined,
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://www.google.com/')
  })
})
