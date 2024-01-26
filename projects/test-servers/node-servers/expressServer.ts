import express from 'express'
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from '../../core/graphql'
import { remultExpress } from '../../core/remult-express'
import { repo } from '../../core'
import { remult } from '../../core/src/remult-proxy'
import { Task } from '../shared/Task'

const app = express()
const api = remultExpress({
  entities: [Task],
  admin: true,
})
app.use(api)
app.get('/api/test', api.withRemult, async (req, res) => {
  res.json({ result: await remult.repo(Task).count() })
})
const { typeDefs, resolvers } = remultGraphql({
  entities: [Task],
})
const yoga = createYoga({
  graphqlEndpoint: '/api/graphql',
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
})
app.use(yoga.graphqlEndpoint, api.withRemult, yoga)
const port = 3004
app.listen(port, () => console.log('express ' + port))
