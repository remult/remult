import type { ServerHandleResponse } from './remult-api-server.js'

export const remultHandlerToResponse = (
  responseFromRemultHandler: ServerHandleResponse | undefined,
  sseResponse: Response | undefined,
  requestUrl: string | undefined,
) => {
  if (sseResponse !== undefined) {
    return sseResponse
  }
  if (
    responseFromRemultHandler !== undefined &&
    responseFromRemultHandler.statusCode !== 404
  ) {
    if (responseFromRemultHandler.html)
      return new Response(responseFromRemultHandler.html, {
        status: responseFromRemultHandler.statusCode,
        headers: {
          'Content-Type': 'text/html',
          ...responseFromRemultHandler.headers,
        },
      })

    if (responseFromRemultHandler.redirectUrl)
      return Response.redirect(
        new URL(responseFromRemultHandler.redirectUrl, requestUrl),
        responseFromRemultHandler.statusCode,
      )

    return new Response(JSON.stringify(responseFromRemultHandler.data), {
      status: responseFromRemultHandler.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  return new Response('Not Found', {
    status: 404,
  })
}
