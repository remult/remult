import fastify from 'fastify'
import { remultApi } from '../../core/remult-fastify'
import fs from 'fs'
import { remult } from '../../core/src/remult-proxy'
import { Task } from '../shared/Task'
;(async () => {
  const server = fastify()
  const api = remultApi({
    entities: [Task],
    admin: true,
    initRequest: async () => {
      throw 'not allowed'
    },
  })
  // const openApiDocument = api.openApiDoc({ title: 'tasks' })
  // fs.writeFileSync(
  //   '/temp/test.json',
  //   JSON.stringify(openApiDocument, undefined, 2),
  // )
  await server.register(api)

  server.get('/api/test', async (req, res) => {
    return {
      result: await api.withRemult(req, () => remult.repo(Task).count()),
    }
  })

  server.get('/api/stream1', async (req, reply) => {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
    reply.raw.writeHead(200, headers)

    let i = setInterval(() => {
      reply.raw.write('noam\n\n')
    }, 1000)

    req.raw.on('close', () => {
      console.log('close connection')
      clearInterval(i)
    })
  })
  const port = 3003
  server.listen({ port }, () => console.log('listening on ' + port))
})()

//https://edisondevadoss.medium.com/fastify-server-sent-events-sse-93de994e013b
