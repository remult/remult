import type { ServerHandleResponse } from './remult-api-server.js'

export const toResponse = (o: {
  sseResponse?: Response
  remultHandlerResponse?: ServerHandleResponse
  requestUrl: string
}) => {
  const { sseResponse, remultHandlerResponse, requestUrl } = o
  if (sseResponse !== undefined) {
    return sseResponse
  }
  if (
    remultHandlerResponse !== undefined &&
    remultHandlerResponse.statusCode !== 404
  ) {
    if (remultHandlerResponse.html)
      return new Response(remultHandlerResponse.html, {
        status: remultHandlerResponse.statusCode,
        headers: {
          'Content-Type': 'text/html',
          ...remultHandlerResponse.headers,
        },
      })

    if (remultHandlerResponse.redirectUrl) {
      console.log(
        `remultHandlerResponse.redirectUrl`,
        remultHandlerResponse.redirectUrl,
      )
      console.log(`requestUrl`, requestUrl)
      console.log(
        `remultHandlerResponse.statusCode`,
        remultHandlerResponse.statusCode,
      )

      return Response.redirect(
        new URL(remultHandlerResponse.redirectUrl, requestUrl),
        remultHandlerResponse.statusCode,
      )
    }

    return new Response(JSON.stringify(remultHandlerResponse.data), {
      status: remultHandlerResponse.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  return new Response('Not Found', {
    status: 404,
  })
}
