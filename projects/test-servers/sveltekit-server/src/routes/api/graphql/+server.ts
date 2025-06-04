import type { RequestEvent } from '@sveltejs/kit'
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from 'remult/graphql'
import { Task } from '../../../../../shared/modules/task/Task.js'

const { typeDefs, resolvers } = remultGraphql({
  entities: [Task],
})

const yogaApp = createYoga<RequestEvent>({
  schema: createSchema({
    typeDefs: createSchema({
      typeDefs,
      resolvers,
    }),
  }),
  fetchAPI: { Response },
})

export { yogaApp as GET, yogaApp as POST }
