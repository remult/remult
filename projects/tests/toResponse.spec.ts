import { toResponse } from '../core/server/toResponse.js'
import { describe, it, expect } from 'vitest'

describe('remultHandlerToResponse', () => {
  it('should return a response', () => {
    const response = toResponse({})
    expect(response).toBeDefined()
  })

  it('should return sse part', async () => {
    const response = toResponse({
      sseResponse: new Response('sse response'),
    })
    expect(await response.text()).toMatchInlineSnapshot(`"sse response"`)
  })

  it('should return 404', async () => {
    const response = toResponse({
      remultHandlerResponse: {
        statusCode: 404,
      },
    })
    expect(response.status).toBe(404)
  })

  it('should return 407', async () => {
    const response = toResponse({
      remultHandlerResponse: {
        statusCode: 407,
      },
    })
    expect(response.status).toBe(407)
  })

  it('should return html with text/html', async () => {
    const response = toResponse({
      remultHandlerResponse: {
        html: 'html response',
        statusCode: 200,
      },
    })
    expect(await response.text()).toBe('html response')
    expect(response.headers.get('Content-Type')).toBe('text/html')
  })

  it('should return data with application/json', async () => {
    const data = { plop: 'hello' }
    const response = toResponse({
      remultHandlerResponse: {
        data,
        statusCode: 200,
      },
    })
    expect(await response.json()).toMatchObject(data)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should redirect', async () => {
    const response = toResponse({
      remultHandlerResponse: {
        redirectUrl: 'https://www.google.com/',
        statusCode: 302,
      },
    })
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('https://www.google.com/')
  })
})
