# Adding Swagger and openApi
 
In short, swagger provides a quick UI that describes the api which is exposed by the application.

To add swagger to a `remult` application follow these steps:
1. Install the `swagger-ui-express` package:
   ```sh
   npm i swagger-ui-express
   npm i --save-dev @types/swagger-ui-express
   ```
2. In the `/src/server/index.ts` file add the following code:
   ```ts{2,6-9}
   import express from 'express';
   import swaggerUi from 'swagger-ui-express';
   import { remultExpress } from 'remult/remult-express';
   
   const app = express();
   let api = remultExpress();

   app.use(api);
   const openApiDocument = api.openApiDoc({ title: "remult-react-todo" });
   app.get("/api/openApi.json", (req, res) => res.json(openApiDocument));
   app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
   
   app.listen(3002, () => console.log("Server started"));
   ```

