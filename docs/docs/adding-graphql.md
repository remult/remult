# Adding Graphql

To add graphql to a `remult` application follow these steps:

1. Install the `graphql-yoga` packages:
   ```sh
   npm i graphql-yoga
   ```

## Express:

In the `/src/server/index.ts` file add the following code:

```ts{3-4,12-22}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from 'remult/graphql';

const app = express()
const entities = [Task]
let api = remultExpress({
   entities
});
app.use(api);
const { typeDefs, resolvers } = remultGraphql({
   entities
});
const yoga = createYoga({
   graphqlEndpoint: '/api/graphql',
   schema: (createSchema({
      typeDefs,
      resolvers
   }))
})
app.use(yoga.graphqlEndpoint, api.withRemult, yoga)
app.listen(3002, () => console.log("Server started"));
```

## Next App Router

```ts
// Next.js Custom Route Handler: https://nextjs.org/docs/app/building-your-application/routing/router-handlers
import { createYoga, createSchema } from 'graphql-yoga'
import { remultGraphql } from 'remult/graphql'
import { api } from '../../../api'
import { Task } from '../../../shared/task'

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
```

## Svelte

`src/routes/api/graphql/+server.ts`

```ts
import type { RequestEvent } from '@sveltejs/kit'
import { createSchema, createYoga } from 'graphql-yoga'
import { remultGraphql } from 'remult/graphql'
import { Task } from '../../../shared/Task'

const { typeDefs, resolvers } = remultGraphql({
  entities: [Task],
})

const yogaApp = createYoga<RequestEvent>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: '/api/graphql',

  fetchAPI: { Response },
})

export { yogaApp as GET, yogaApp as OPTIONS, yogaApp as POST }
```
