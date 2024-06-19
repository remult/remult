// Next.js Custom Route Handler: https://nextjs.org/docs/app/building-your-application/routing/router-handlers
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from 'remult/graphql'
import { Task } from '../../../shared/task'
import { api } from '../[...remult]/api'

const { typeDefs, resolvers } = remultGraphql({
  entities: [Task],
})

const yoga = createYoga({
  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: '/api/graphql',
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },
})

const handleRequest = (request: any, ctx: any) =>
  api.withRemult(() => yoga.handleRequest(request, ctx))

export { handleRequest as GET, handleRequest as POST }
