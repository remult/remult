import type { RequestEvent } from "@sveltejs/kit"
import { createSchema, createYoga } from "graphql-yoga"
import { remultGraphql } from "remult/graphql"
import { api } from "../../../api.server"

const { schema, rootValue } = remultGraphql(api)

const yogaApp = createYoga<RequestEvent>({
  schema: createSchema({
    typeDefs: schema,
    resolvers: {}
  })
})

export { yogaApp as GET, yogaApp as POST }
