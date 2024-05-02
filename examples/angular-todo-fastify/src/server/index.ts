import fastify from 'fastify'
import { api } from './api';
(async () => {
  const server = fastify()

  await server.register(api)

  server.listen({ port: 3002 })
})()