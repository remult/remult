import Hapi, { type Plugin } from '@hapi/hapi'
import { PassThrough } from 'stream'
import { remultApi } from '../../core/remult-hapi'
import { Task } from '../shared/Task'
import { remult } from '../../core/'

const routesPlugin: Plugin<undefined> = {
  name: 'routesPlugin',
  register: async (server: Hapi.Server) => {
    server.route({
      method: 'GET',
      path: '/',
      handler: (request, h) => {
        return 'Hello, this is the root route!'
      },
    })

    server.route({
      method: 'GET',
      path: '/hello/{name}',
      handler: (request, h) => {
        const { name } = request.params
        return `Hello, ${name}!`
      },
    })
    server.route({
      method: 'GET',
      path: '/stream',
      handler: (request, h) => {
        const currentTime = () => new Date().toUTCString()

        let stream = new PassThrough()

        const response = h
          .response(stream)
          .header('content-type', 'text/event-stream')
          .header('content-encoding', 'identity')

        const intervalId = setInterval(() => {
          const formattedTime = `data: ${currentTime()}\n\n`
          stream.write(formattedTime)
        }, 1000) // Send time every second

        // Stop sending when the client disconnects
        request.raw.req.on('close', () => {
          clearInterval(intervalId)
          console.log('Connection closed')
        })

        return response
      },
    })
  },
}

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: '127.0.0.1',
  })

  const api = remultApi({ entities: [Task], admin: true })
  await server.register(api)
  await server.register({
    plugin: routesPlugin,
    options: {
      // You can pass options to your plugin if needed
    },
  })
  server.route({
    method: 'GET',
    path: '/api/test',
    handler: async (request, h) => {
      const remult = await api.getRemult(request)
      return {
        result: await remult.repo(Task).count(),
      }
    },
  })

  server.route({
    method: 'GET',
    path: '/api/test2',
    handler: async (request, h) => {
      return api.withRemult(request, async () => {
        return {
          result: await remult.repo(Task).count(),
        }
      })
    },
  })

  try {
    await server.start()
    console.log('Server running on %s', server.info.uri)
  } catch (err) {
    console.error('Error starting server:', err)
    process.exit(1)
  }
}

init()
