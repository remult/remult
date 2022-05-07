# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism which enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field level authorization code should be placed in entity classes**.

User authentication remains outside the scope of Remult. In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

### Tasks CRUD operations require sign in
This rule is implemented within the `Task` entity class constructor, by modifying the `allowApiCrud` property of the anonymous implementation of the argument sent to the `@Entity` decorator, from a `true` value to an arrow function which accepts a Remult `Remult` object and returns the result of the Remult's `authenticated` method.

*src/shared/Task.ts*
```ts{2}
@Entity("tasks", {
    allowApiCrud: Allow.authenticated
})
```

After the browser refreshes, the list of tasks disappeared and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL
```sh
curl -i http://localhost:3002/api/tasks
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `TasksController`.

*src/shared/TasksController.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
:::

### Load the tasks only if the user is authenticated
Add the following code to the the `useEffect` hook with the following code:

*src/App.tsx*
```tsx{2-3}
useEffect(() => {
  if (taskRepo.metadata.apiReadAllowed)
    taskRepo.find({
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
    }).then(setTasks);
}, [hideCompleted, reload]);
```

### User authentication
Let's add a sign in area to the todo app, with an `input` for typing in a `username` and a sign in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign in, the sign in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [jwt-decode](https://github.com/auth0/jwt-decode) for client-side JWT decoding.
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server



1. Open a terminal and run the following command to install the required packages:
   ```sh
   npm i jsonwebtoken jwt-decode express-jwt
   npm i --save-dev @types/jsonwebtoken 
   ```

5. Exclude `jsonwebtoken` from browser builds by adding the following JSON to the main section of the project's `package.json` file.

   *package.json*
   ```json
   "browser": {
      "jsonwebtoken": false
   }
   ```

   ::: danger This step is not optional
   React CLI will fail to serve/build the app unless `jsonwebtoken` is excluded.

   **For this change to take effect, our React app's dev server must be restarted by terminating the `dev-react` script and running it again.**
   :::

2. Create a file called `src/shared/AuthController.ts ` and place the following code in it:
   *src/shared/AuthController.ts*
   ```ts
   import * as jwt from 'jsonwebtoken';
   import { BackendMethod } from 'remult';

   export class AuthController {
      @BackendMethod({ allowed: true })
      static async signIn(username: string) {
         const validUsers = [
               { id: "1", name: "Jane", roles: [] },
               { id: "2", name: "Steve", roles: [] }
         ];
         const user = validUsers.find(user => user.name === username);
         if (!user)
               throw new Error("Invalid User");
         return jwt.sign(user, getJwtSigningKey());
      }
   }

   export function getJwtSigningKey() {
      if (process.env.NODE_ENV === "production")
         return process.env.TOKEN_SIGN_KEY!;
      return "my secret key";
   }
   ```
   And add it to the `controllers` array on the `server`
   ```ts{5,10}
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController } from '../shared/AuthController';
   
   let app = express();
   app.use(remultExpress({
       entities: [Task],
       controllers: [TasksController, AuthController],
       initApi: async remult => {
       ...
   ```
   * Note that The (very) simplistic `signIn` function will accept a `username` argument, define a dictionary of valid users, check whether the argument value exists in the dictionary and return a JWT string signed with a secret key. 
   
   The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.

3. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{2,6,63,9-13}
   import express from 'express';
   import { expressjwt } from 'express-jwt';
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { TasksController } from '../shared/TasksController';
   import { AuthController, getJwtSigningKey } from '../shared/AuthController';
   
   let app = express();
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress({
   ...
   ```

   The `expressjwt` module verifies for each request that the auth token is valid, and extracts the user info from it to be used on the server.


   `credentialsRequired` is set to `false` to allow unauthenticated API requests (e.g. the request to `signIn`).

   The `algorithms` property must contain the algorithm used to sign the JWT (`HS256` is the default algorithm used by `jsonwebtoken`).

4. Add the following code that manages the auth token and includes it in the header of `axios` based requests in the `common.ts` file. The auth token is also stored in the `sessionStorage` to be retrieved when the user reloads the page.

   *src/common.ts*
   ```ts{2,7-27}
   import axios from 'axios';
   import jwtDecode from 'jwt-decode';
   import { Remult } from "remult";

   export const remult = new Remult(axios);

   const AUTH_TOKEN_KEY = "authToken";

   export function setAuthToken(token: string | null) {
      if (token) {
         remult.setUser(jwtDecode(token));
         sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      else {
         remult.setUser(undefined!);
         sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
   }

   // Initialize the auth token from session storage when the application loads
   setAuthToken(sessionStorage.getItem(AUTH_TOKEN_KEY));

   axios.interceptors.request.use(config => {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (token)
         config.headers!["Authorization"] = "Bearer " + token;
      return config;
   });
   ```

6. Add the following code to the `App` function component, and replace the beginning of the `return` statement to include the user greeting and sign out button.

   *src/App.tsx*
   ```tsx
   const [username, setUsername] = useState("");
   const signIn = async () => {
     setAuthToken(await AuthController.signIn(username));
     setReload({});
   }
   const signOut = () => {
     setAuthToken(null);
     setTasks([]);
   }
   if (!remult.authenticated())
      return (<div>
        <p>
          <input value={username} onChange={e => setUsername(e.target.value)}  />
          <button onClick={signIn}>Sign in</button> <span style={{ color:  'green' }}></span>
        </p>
      </div>);
 
   return (
     <div>
       <p>
         Hi {remult.user.name} <button onClick={signOut}>Sign out </button>
       </p>
       //... the rest of the tsx html part
   ```

   ::: warning Imports
   This code requires imports for `AuthController` from `./shared/AuthController` and `setAuthToken` from the existing import of `./common`.
   :::



The todo app now supports signing in and out, with all access restricted to signed in users only.

### Role-based authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo list, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/shared/` folder, with the following `Roles` class definition:

   *src/shared/Roles.ts*
   ```ts
   export const Roles = {
      admin: 'admin'
   }
   ```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

   *src/shared/Task.ts*
   ```ts{2,5-8,15}
   import { Allow, Entity, Fields, Validators } from "remult";
   import { Roles } from "./Roles";
   
   @Entity<Task>("tasks", {
       allowApiRead: Allow.authenticated,
       allowApiUpdate: Allow.authenticated,
       allowApiInsert: Roles.admin,
       allowApiDelete: Roles.admin
   })
   export class Task {
       @Fields.uuid()
       id!: string;
       @Fields.string({
           validate: Validators.required,
           allowApiUpdate: Roles.admin
       })
       title = '';
       @Fields.boolean()
       completed = false;
       @Fields.date()
       lastUpdated = new Date()
   }
   ```
3. Modify the highlighted line in the `TasksController` class to reflect the authorization rule
   *src/shared/TasksController.ts*
   ```ts{3,7}
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./Task";
   import { Roles } from "./Roles";
   
   export class TasksController {
   
       @BackendMethod({ allowed: Roles.admin })
       static async setAll(completed: boolean, remult?: Remult) {
           const taskRepo = remult!.repo(Task);
           for await (const task of taskRepo.query()) {
               await taskRepo.save({ ...task, completed });
           }
       }
   }
   ```

4. Let's have the *"Jane"* belong to the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` server function.

   *src/shared/AuthController.ts*
   ```ts{4}
   @BackendMethod({ allowed: true })
   static async signIn(username: string) {
      const validUsers = [
      { id: "1", name: "Jane", roles: [ Roles.admin] },
      { id: "2", name: "Steve", roles: [] }
      ];
      const user = validUsers.find(user => user.name === username);
      if (!user)
         throw new Error("Invalid User");
      return jwt.sign(user, getJwtSigningKey());
   }
   ```


**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**