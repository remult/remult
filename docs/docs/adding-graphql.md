# Adding Graphql

To add graphql to a `remult` application follow these steps:

1. Install the `graphql` and `express-graphql` packages:
   ```sh
   npm i graphql express-graphql
   ```
2. In the `/src/server/index.ts` file add the following code:

   ```ts{3-4,12-21}
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
