# Adding Graphql
 
To add graphql to a `remult` application follow these steps:
1. Install the `graphql` and `express-graphql` packages:
   ```sh
   npm i graphql express-graphql
      ```
2. In the `/src/server/index.ts` file add the following code:
   ```ts{2-4,8-15}
   import express from 'express';
   import { buildSchema } from 'graphql';
   import { graphqlHTTP } from 'express-graphql';
   import { remultGraphql } from 'remult/graphql';
   import { remultExpress } from 'remult/remult-express';
   
   let app = express();
   let api = remultExpress();
   app.use(api);
   const { schema, rootValue } = remultGraphql(api);
   app.use('/api/graphql', graphqlHTTP({
       schema: buildSchema(schema),
       rootValue,
       graphiql: true,
   }));
   app.listen(3002, () => console.log("Server started"));
   ```

