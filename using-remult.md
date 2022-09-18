# Using remult

With remult you can easily create a single source of truth, your entities - and define your data access, routes, validations, and authorization around them.

## Quick demo
* for an in depth explanation of the setup & configuration see one of the tutorials (react tutorial)
1. One time setup
   1. Setup express
      
      *src/server/index.ts*
      ```ts
      import express from 'express';
      const app = express();
      app.listen(3002, () => console.log("Server started"));
      ```
   2. Configure remult in `api.ts`
      
      *src/server/api.ts*
      ```ts
      import { remultExpress } from 'remult/remult-express';
      export const api = remultExpress();
      ```
   3. Register remult with express
      
      *src/server/index.ts*
      ```ts
      //...
      const app = express();
      app.use(api);
      app.listen(3002, () => console.log("Server started"));
      ```
2. Add an Entity
   1. Create the entity
      
      *src/shared/entity.ts*
      ```ts
      import { Entity, Fields } from "remult";
      @Entity("tasks", {
          allowApiCrud: true
      })
      export class Task {
         @Fields.uuid()
         id!: string;
         @Fields.string()
         title = '';
         @Fields.boolean()
         completed = false;
      }
      ```
   2. Register the entity in the api
      
      *src/server/api.ts*
      ```ts
      export const api = remultExpress({
        entities:[Task]
      });
      ```
> Fully working Rest API 
>
> At this point, you have a fully working API for your entity. Because we've set the `allowApiCrud` to `true` the api exposes: GET, PUT, POST, and DELETE  operations at the `/api/tasks` route.
> Later we'll restrict that some more

3. CRUD on the server
   *src/server/api.ts*
   ```ts
   export const api = remultExpress({
     entities: [Task],
     initApi: async () => {
       const taskRepo = remult.repo(Task);
       for (const task of await taskRepo.find()) {
         await taskRepo.delete(task);
       }
       await taskRepo.insert(
         [{ title: "Task a" },
          { title: "Task b", completed: true },
          { title: "Task c" }]);
       console.log(await taskRepo.count({ completed: false })) //should write 2
       const tasks = await taskRepo.find({
         limit: 1,
         where: { completed: false }
       });
       await taskRepo.save({ ...(tasks[0]), completed: true });
       console.log(await taskRepo.count({ completed: false })) //should write 1
     }
   });
   ```
   * The `initApi` method runs when the server loads.
   * The `remult.repo(Task)` returns a `Repository` for tasks that can be used to perform the full range of `CRUD` capabilities. On the server, the `Repository` is used to access the database, on the front-end that same repository is used to access the backend via Rest API calls.
4. CRUD on the frontend
   
   *frontend.ts*
   ```ts
   import { remult } from "remult";
   import { Task } from "./shared/Task";
   remult.apiClient.url = 'https://localhost:3002/api'; //set the url for the backend, defaults to `/api`
   
   const taskRepo = remult.repo(Task);
   console.table(await taskRepo.find({
     // built in support for server side paging, sort and filtering
     limit: 2,
     page: 1,
     orderBy: {
       title: "asc"
     },
     where: {
       completed: false
     }
   }));
   ```
   * The same `Repository` object that was used on the server, is now used in the front-end to perform typed rest api calls to the server.
5. Validation

   *src/shared/entity.ts*
   ```ts
   import { Entity, Fields } from "remult";
   @Entity("tasks", {
       allowApiCrud: true
   })
   export class Task {
      @Fields.uuid()
      id!: string;
      @Fields.string<Task>({
        validate:task=>{
          if (task.title.length<3)
            throw new Error("Too short")
        }
      })
      title = '';
      @Fields.boolean()
      completed = false;
   }
   ```
   * The `validate` is defined in our `single source of truth` - the Entity, and will execute both on the front-end to provide a great user experience, and on the backend, to protect the api. 
     * It returns a structured error that can be used to display relevant data next to the inputs on the Using
     ```json
     {
       "modelState": {
         "title": "Too short"
       },
       "message": "Title: Too short"
     }
     ```   
6. Authorization

  *src/shared/entity.ts*
   ```ts
   @Entity("tasks", {
       allowApiCrud: Allow.authenticated,
       allowApiDelete: "admin"
   })
   export class Task {
      @Fields.uuid()
      id!: string;
      @Fields.string<Task>()
      title = '';
      @Fields.boolean({
       allowApiUpdate:"admin"
      })
      completed = false;
   }
   ```
   * You can defined all the authorization riles in our `single source of truth` the Entity, and it'll be enforced throughout the application.
   
     All you need to do, is tell remult how to extract the user   from the Request
  
     *src/server/api.ts*
     ```ts
     export const api = remultExpress({
      entities:[Task],
      getUser:request => // code to extract the user from the request
     });
     ```

   * You can reuse these same authorization rules in the front-end for consistency
   
     *frontend.ts*
     ```ts
     remult.user = // code to determine the current user
     //...
     if (taskRepo.metadata.apiDeleteAllowed){
       // display the delete button
     }
     ```
      