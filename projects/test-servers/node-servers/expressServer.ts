import express from 'express'
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from '../../core/graphql'
import { remultApi } from '../../core/remult-express'
import { repo } from '../../core'
import { remult } from '../../core/src/remult-proxy'
import { Task } from '../shared/Task'

const app = express()
const api = remultApi({
  entities: [Task],
  admin: () => 1 + 1 == 2,
})
app.use(api)
app.get('/api/test', api.withRemult, async (req, res) => {
  res.json({ result: await remult.repo(Task).count() })
})
import swaggerUi from 'swagger-ui-express'

const openApiDocument = api.openApiDoc({ title: 'remult-react-todo' })
app.get('/api/openApi.json', (req, res) => res.json(openApiDocument))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

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
