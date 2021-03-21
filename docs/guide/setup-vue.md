# Setup for Vue

This tutorial uses the Vue cli typescript template as a starting point.


## Create the Vue Project
We'll run the following command:

```sh
vue create my-project
```

And select the following options in each question:
1. "Please pick a preset:" select `Manually select features`
2. "Check the features needed for your project:" select `Choose Vue version`, `Babel`, `TypeScript` and clear everything else.
3. "Choose a version of Vue.js that you want to start the project with:" select `2.x`
4. "Use class-style component syntax?" select `Yes`
5. "Use Babel alongside Typescript?" select `Yes`
6. "Where do you prefer placing config for Babel, ESLint, etc.?" select `In package.json`
7. "Save this as a preset for future projects?" select `No`

::: tip Note
These settings are not mandatory, they are simply the ones we have used while creating this article.

The only mandatory setting is  `TypeScript`.
:::

### Add Routes to Vue
Run:
```sh
npm i vue-router
```

Add a file called `src/router.ts`
```ts
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/hello',
            component: () => import("./components/HelloWorld.vue")
        }
    ]
});
export default router;
```

in the `src/main.ts` file add the router reference:
```ts{3,8}
import Vue from 'vue'
import App from './App.vue'
import router from "./router";

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')

```

replace the src in `src/App.vue` with the following source:
```vue {1-9,16-18}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav></nav>
    <div>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class App extends Vue {
   async errorCaptured(err: any) {
    alert(err.message);
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```
* We've adjusted the template to use the router
* we've added general error handling code to the `App` component


At this stage, the vue app is ready for our demo

## Setup Remult
### Install the Server components
Now we'll add the server functionality to the same project.

```sh
npm i express express-force-https jsonwebtoken compression pg reflect-metadata @types/pg @remult/core @remult/server @remult/server-postgres tsc-watch
```


### Add .env file for server configuration
in the root directory of the project, create a file called `.env` this file will hold all the environment information for the server in your development environment.

In the production environment, these variables will be set by environment variables from the server.

Place the following lines in that file:
```
DATABASE_URL='postgres://postgres:somepassword@localhost/postgres'
DISABLE_POSTGRES_SSL=true
DISABLE_HTTPS=true
```

* `DATABASE_URL`: the url for connection to the database, using the structure: `postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE_NAME*`
* `DISABLE_POSTGRES_SSL`: most dev environments are not configured to support ssl, this flag disables ssl for development, in production ssl will be used.
* `DISABLE_HTTPS`: most dev environments do not require ssl, this flags disables ssl for development, in production ssl will  be used.

### Add the server code
create a folder called `server` under the `src` folder, and in it add a file called `server.ts` with the following code

``` ts
import express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';


config(); //loads the configuration from the .env file
initDatabase().then(database => { 
    let app = express();
    initExpress(app, database, process.env.DISABLE_HTTPS == "true"); 
    app.use(express.static('dist'));
    app.use('/*', async (req, res) => {

        const index = 'dist/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result: ' + index);
        }
    });
    let port = process.env.PORT || 3002;
    app.listen(port);
    
});

async function initDatabase() {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw "No DATABASE_URL environment variable found, if you are developing locally, please add a '.env' with DATABASE_URL='postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE*'";
    }
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.DISABLE_POSTGRES_SSL ? false : { rejectUnauthorized: false }
    });
    let database = new SqlDatabase(new PostgresDataProvider(pool));
    await new PostgresSchemaBuilder(database).verifyStructureOfAllEntities();
    return database;
}
```

### Add tsconfig.server.json
Next to the existing `tsconfig.json` we'll add a new `tsconfig` file for the server project. in the root directory add a file called `tsconfig.server.json` and place the following content in it.
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist-server/",
    "module": "commonjs",
    "target": "es5",
    "skipLibCheck": true,
    "emitDecoratorMetadata": true
    
  },
  "files": [
    "./src/server/server.ts"
  ]
}
```

### Exclude server from the Vue tsconfig.json
```JSON{4}
...
 "exclude": [
    "node_modules"
    ,"./src/server/**"
  ]
}

```


### Add the dist-server folder to git ignore
The `dist-server` will hold the transpiled version of the server code - there is no need to commit it to git (just like the `dist` forder)

in the `.gitignore` file add:
```
/dist-server
```


### Add script to build server to the package.json
```json{4}
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "node-serve": "./node_modules/.bin/tsc-watch -p tsconfig.server.json --onSuccess \"node dist-server/server/server.js\""
  },
```

### Add a proxy configuration
We'll add a proxy configuration to the Vue cli dev server, to forward all unknown requests to the node server on port 3002.

We'll add a file called `vue.config.js`
```js
module.exports = {
    devServer: {
        proxy: 'http://localhost:3002'
      }
}
```

### Configure the remult context
Add a file called `src/common.ts`
```ts
import { Context } from "@remult/core";
export const context = new Context();
```

### Run the Project
We'll run two terminals
1. Vue Dev Server - `npm run serve`
2. Node Server - `npm run node-serve`


## Entities
The first advantage that `remult` provides is the ability to define an entity once, and use the same code both on the server and in the browser.
The Api, Database and communication are all derived from that one definition of an entity.

Add a folder called `src/users` and in it add a file called `users.ts`, with the following code:

```ts
import { EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: 'users',
            allowApiCRUD: true
        })
    }
}
```
In this source file we've defined the `Users` entity that has a single member called `name`.

Next, we'll register it in the `server.ts`, add the following statement to the `server.ts` import section
```ts
import '../users/users';
```

Once you save the file you'll see in the `node-serve` terminal window that the table is created in the database, and that a new api entry called `/api/users` is created.
```{5-9}
10:09:32 AM - Starting compilation in watch mode...

10:09:33 AM - Found 0 errors. Watching for file changes.
start verify structure
create table users (
  id varchar default '' not null  primary key,
  name varchar default '' not null
)
/api/users
```

The `/api/users` api route provides a RestApi for the data in the `users` entity

Next we'll use this entity in our vue app.

### Create UserList.vue
Add a new file called `components/UserList.vue` with the following code:
```vue
<template>
  <div>
    <h2>User List {{users.length}}</h2>
    <div v-for="user in users" :key="user.id.value">
      <input v-model="user.name.value" />
    </div>
  </div>
</template>

<script lang="ts">
import { context } from "@/common";
import { Users } from "@/users/users";
import { Component, Vue } from "vue-property-decorator";
@Component
export default class UserList extends Vue {
  users: Users[] = [];
  async loadUsers() {
    try {
      this.users = await context.for(Users).find();
    } catch (err) {
      alert(err.message);
    }
  }
  mounted() {
    this.loadUsers();
  }
}
</script>
```

* we've defined a `users` array, of type `Users`
* we've created a `loadUsers` method that uses the `context` object, to retrieve the users from the server and place them in the `this.users` member.
* we've called the `loadUsers` method from the `mounted` Vue method.

#### Add users route
In the `router.ts` file, replace the `hello` path with the `users path`
```ts{11-12}
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/users',
            component: () => import("./components/UserList.vue")
        }
    ]
});
export default router;
```

#### Add User List link in the App.vue file
```vue {5}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav>
      <router-link to="/users">User List</router-link>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>
```

Now that you'll navigate to the `/users` route you'll see that there are no users in the list. Let's work on adding a new User.

### AddUser.vue 
Add a new file called `components/AddUser.vue` with the following code:
```vue {16,18}
<template>
  <div>
    <h2>Add User</h2>
    <input v-model="newUser.name.value" />
    <button v-on:click="addTheUser">add User</button>
  </div>
</template>

<script lang="ts">
import { context } from '@/common';
import router from "@/router";
import { Users } from "@/users/users";
import { Component, Vue } from "vue-property-decorator";
@Component
export default class AddUser extends Vue {
  newUser = context.for(Users).create();
  async addTheUser() {
    await this.newUser.save();
    router.push({ path: "/users" });
  }
}
</script>
```
* We'll define a member called `newUser` with a new instance of the `Users` Entity, created by the `context` object
* Once the users clicks on Add User, we'll call the `save` method of the `Users` entity to save that user to the database.
* After the user is saved, we'll use the `router.push` method to navigate to the users list

#### Add the AddUserRoute
In the `router.ts` file, add a new route called `add-user`
```ts {6-9}
routes: [
    {
        path: '/users',
        component: () => import("./components/UserList.vue")
    }
    ,{
        path: '/add-user',
        component: () => import("./components/AddUser.vue")
    }
]
```

#### Add "Add User" link in the App.vue file
```vue {6}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav>
      <router-link to="/users">User List</router-link>
      | <router-link to="/add-user">Add User</router-link>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>
```


::: tip Testing what we've done so far
Now you can run the application, create a few users and view them in the Users List.

You're invited to have a look in the database and see that the users exist in the db, and also test the api directly `localhost:3002/api/users` to see that you're getting results from the api.
:::

## Sorting the Users
We can filter and sort the rows that the find method returns, for more info see [findOptions](ref_findoptions.html).

In the `UserList.vue` file, change the `loadUsers` method:
```ts {3-5}
async loadUsers() {
  try {
    this.users = await context.for(Users).find({
      orderBy: (u) => u.name,
    });
  } catch (err) {
    alert(err.message);
  }
}
```

## Record the User Create Date
In the `users.ts` file add the `createdDate` column
```ts {6}
import { DateTimeColumn, EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn();
    createdDate = new DateTimeColumn();
    constructor() {
        super({
            name: 'users',
            allowApiCRUD: true
        })
    }
}
```

As soon as we'll save the file, we'll see in the `node-serve` terminal window that the table was altered to add the `createdDate` column
``` {2}
11:44:20 AM - Found 0 errors. Watching for file changes.
start verify structure
alter table users add column createdDate timestamp
/api/users
```

Next we'll add the logic to update this column using the `saving` hook.
```ts {10-13}
import { DateTimeColumn, EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn();
    createdDate = new DateTimeColumn();
    constructor() {
        super({
            name: 'users',
            saving: () => {
                if (this.isNew())
                    this.createdDate.value = new Date()
            },
            allowApiCRUD: true
        })
    }
}
```

The `saving` hook is executed before the row is saved both in the browser or on the server.

### Add the created date to the User List
In the `UserList.vue` file's template section, we'll add the created date to display the date in which the row was created.
```vue {6}
<template>
  <div>
    <h2>User List {{ users.length }}</h2>
    <div v-for="user in users" :key="user.id.value">
      <input v-model="user.name.value" />
      created on: {{user.createdDate.displayValue}}
    </div>
  </div>
</template>
```

::: tip Note
The existing rows do not have any value for the `createdDate` column - but any new row that we'll create will now have this value
:::


## Deleting Users
Let's add the functionality to delete users to the `UserList.vue` file
```vue {7,28-31}
<template>
  <div>
    <h2>User List {{ users.length }}</h2>
    <div v-for="user in users" :key="user.id.value">
      <input v-model="user.name.value" />
      created on: {{user.createdDate.displayValue}}
      <button v-on:click="deleteUser(user)"> Delete</button>
    </div>
  </div>
</template>

<script lang="ts">
import { context } from "@/common";
import { Users } from "@/users/users";
import { Component, Vue } from "vue-property-decorator";
@Component
export default class UserList extends Vue {
  users: Users[] = [];
  async loadUsers() {
    try {
      this.users = await context.for(Users).find({
        orderBy: (u) => u.name,
      });
    } catch (err) {
      alert(err.message);
    }
  }
  async deleteUser(user:Users){
      await user.delete();
      this.loadUsers();
  }
  mounted() {
    this.loadUsers();
  }
}
</script>
```

::: tip Testing what we've done so far
Delete all users that are missing the created date, and create new users to see that it all updates correctly
:::



## Saving Changes to Users
In the `UserList.vue` file we'll add the save button
```vue {6-8}
<template>
  <div>
    <h2>User List {{ users.length }}</h2>
    <div v-for="user in users" :key="user.id.value">
      <input v-model="user.name.value" />
      <button v-on:click="user.save()" v-if="user.wasChanged()">
        Save Changes
      </button>
      created on: {{ user.createdDate.displayValue }}
      <button v-on:click="deleteUser(user)">Delete</button>
    </div>
  </div>
</template>
```
*  we use the `user.wasChanged()` method to only display the `save` button when the user was changed.

## Validation
Validating the user input is an important part of any data base application. When you're developing for the web, you are always warned to do the validations both on the server, and in the browser, to make sure that no one will access the api directly and update invalid data.

With remult, you write your validations in one place, and they run both in the browser, and on the server making sure that the validation will also occur if the api is called directly.

In the `users.ts` file we'll add the validation:
```ts {3-8}
@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        validate:()=>{
            if (this.name.value.length<3)
                this.name.validationError = 'Name is too short';
        }
    });
    createdDate = new DateTimeColumn();
    constructor() {
    ...

```

::: tip Testing what we've done so far
Try updating invalid values and see that you're getting the validation error.

Try updating valid info, and see that it works.

Try this also for new users you create and see that the validation applies there as well.
:::


## Sign In

When the users sign's in, we'll want to call a function on the server that will validate that the user exists, for that we'll use the `@ServerFunction` decorator.

In the `users.ts` file:
```ts {22-33}
import { Context, DateTimeColumn, EntityClass, IdEntity, ServerFunction, StringColumn, UserInfo } from "@remult/core";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 3)
                this.name.validationError = 'Name is too short';
        }
    });
    createdDate = new DateTimeColumn();
    constructor() {
        super({
            name: 'users',
            saving: () => {
                if (this.isNew())
                    this.createdDate.value = new Date()
            },
            allowApiCRUD: true
        })
    }
    @ServerFunction({ allowed: true })
    static async signIn(name: string, context?: Context) {
        const u = await context?.for(Users).findFirst(user => user.name.isEqualTo(name));
        if (!u)
            throw "user does not exist";
        const user: UserInfo = {
            id: u.id.value,
            name: u.name.value,
            roles: []
        };
        return user;
    }
}
```
* By decorating the `signIn` method with the `@ServerFunction` decorator, we declare that we want this `function` to run on the server.
* The function receives the optional `context?` parameter. This parameter will be automatically populated on the server with the relevant `Context` for operating on the server.

### Create the sign in vue
Add a new file called `components/SignIn.vue` with the following code:
```vue
<template>
  <div>
    <h2>Sign In</h2>
    <input v-model="name" /> <button v-on:click="signIn">Sign In</button>
  </div>
</template>

<script lang="ts">
import router from "@/router";
import { Users } from "@/users/users";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class SignIn extends Vue {
  name = "";
  async signIn() {
    const user = await Users.signIn(this.name);
    alert("Hello " + user.name);
  }
}
</script>
```

### Add the sign-in route
In the `router.ts` file, add a new route called `sign-in`
```ts {6-9}
routes: [
  {
      path: '/users',
      component: () => import("./components/UserList.vue")
  },
  {
      path: '/sign-in',
      component: () => import("./components/SignIn.vue")
  },
  {
      path: '/add-user',
      component: () => import("./components/AddUser.vue")
  }
]
```

#### Add "Add User" link in the App.vue file

```vue {7}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav>
      <router-link to="/users">User List</router-link>
      | <router-link to="/add-user">Add User</router-link>
      | <router-link to="/sign-in">Sign In</router-link>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>
```

::: tip Testing what we've done so far
Try signing in with a user that doesn't exist, and see that you get an error.

Try signing in with a user that does exist, and see that you get the user name
:::


## Securing the Application
A critical part of any web application, is making sure that only authorized users can use an application, and that each request is coming from the correct user.

After the user Signs In, we need to include their information for each request, and to make sure that it's indeed that user that is making the request.

For that we'll use a technology called JWT that provides us with a token that includes the user information and makes sure that that information was not altered. [See Jwt](https://jwt.io/).

Here's how it's going to work:
1. When the user signs in on the server, it'll generate a token using a secret hash key that only the server knows.
2. Once the browser get's that token, it'll store it in a cookie and include it in each following request.
3. Whenever a request reaches the server, it'll validate that info in the token, using the secret hash key, and will accept the request only if they match.

This way the browser and server can share and trust that user info.

* In vue, you can access the user info, using the `user` property of the `context`.


### Introducing JWT authorization to the project
#### Step 1 
In the `common.ts` file adjust the following code:
```ts {2,4}
import { Context } from "@remult/core";
import { CookieBasedJwt } from '@remult/core/src/cookieBasedJwt';
export const context = new Context();
export const authorization = new CookieBasedJwt(context);
```

#### Step 2, add the secret hash key to .env
in the `.env` file
```
TOKEN_SIGN_KEY='My very very secret key'
```
::: warning
In production use a completely random string, you can generate one using: [Online UUID Generator
](https://www.uuidgenerator.net/version4)
:::

#### Step 3, define the key when the server loads
in `server.ts`
```ts {8,14-18}
import express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import { authorization } from '../common';
import '../users/users';

config(); //loads the configuration from the .env file
initDatabase().then(database => {
    let app = express();
    let s = initExpress(app, database, process.env.DISABLE_HTTPS == "true");
    let signKey = process.env.TOKEN_SIGN_KEY;
    if (!signKey)
        throw "Please set the TOKEN_SIGN_KEY with a secret sign key";
    authorization.init(s, signKey);
    app.use(express.static('dist'));
    app.use('/*', async (req, res) => {
```

#### Step 4, create the token when the user signs in
in `users.ts`
```ts {33}
import { authorization } from '../common';
import { Context, DateTimeColumn, EntityClass, IdEntity, ServerFunction, StringColumn, UserInfo } from "@remult/core";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 3)
                this.name.validationError = 'Name is too short';
        }
    });
    createdDate = new DateTimeColumn();
    constructor() {
        super({
            name: 'users',
            saving: () => {
                if (this.isNew())
                    this.createdDate.value = new Date()
            },
            allowApiCRUD: true
        })
    }
    @ServerFunction({ allowed: true })
    static async signIn(name: string, context?: Context) {
        const u = await context?.for(Users).findFirst(user => user.name.isEqualTo(name));
        if (!u)
            throw "user does not exist";
        const user: UserInfo = {
            id: u.id.value,
            name: u.name.value,
            roles: []
        };
        return authorization.createToken(user);
    }
}
```

#### Step 5, store the token after the user signs in
In the `SignIn.vue` file:
```vue {2,11-14}
<script lang="ts">
import { authorization, context } from "@/common";
import router from "@/router";
import { Users } from "@/users/users";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class SignIn extends Vue {
  name = "";
  async signIn() {
    const jwt = await Users.signIn(this.name);
    authorization.afterSignIn(jwt, true);
    alert("Hello " + context.user.name); //use this just for testing, remove it once you're happy
    router.push({ path: "/users" });// navigate to the users list after a successful sign in
  }
}
</script>
```

#### Show the currently signed in user
Now that the users are configured correctly, let's display them in the navigation bar in `App.vue`
```vue {7-11,21,26,30-33}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav>
      <router-link to="/users">User List</router-link>
      | <router-link to="/add-user">Add User</router-link> 
      | <router-link to="/sign-in" v-if="!context.isSignedIn()">
        Sign In
      </router-link>
      <span v-if="context.isSignedIn()"> Hello {{ context.user.name }} </span>
      <button v-if="context.isSignedIn()" v-on:click="signOut">Sign Out</button>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { authorization, context } from "./common";
import router from "./router";

@Component
export default class App extends Vue {
  context = context;
  async errorCaptured(err: any) {
    alert(err.message);
  }
  signOut() {
    authorization.signOut();
    router.push({ path: "/sign-in" });
  }
}
</script>
...
```

::: tip Testing what we've done so far
Sign in and out to see that it all works.

Try reloading the page and see that the user info is stored between sessions.

You can change that behavior by sending `false` as the second parameter to the `afterSignIn` method in the `sign-in.vue` page.
:::

#### Only show the user list to users that have signed in
Now that we have complete user authentication and authorization we can start enjoying it :)

First, let's restrict the access to the `users` api, so only signed in users can see the data .

In the `users.ts` adjust the following code lines:
```ts {17,18}
@EntityClass
export class Users extends IdEntity {
  name = new StringColumn({
      validate: () => {
          if (this.name.value.length < 3)
              this.name.validationError = 'Name is too short';
      }
  });
  createdDate = new DateTimeColumn();
  constructor() {
      super({
          name: 'users',
          saving: () => {
              if (this.isNew())
                  this.createdDate.value = new Date()
          },
          allowApiCRUD: context => context.isSignedIn(),
          allowApiRead: context => context.isSignedIn()
      })
  }
```

::: tip Testing what we've done so far
Sign in and out a and test the UserList page
:::

## Adding Roles and using them
Not all users are the same, some have more roles there others.

To manage that, add `roles.ts` file in the `src/users` folder.
```ts
export class Roles {
    static canUpdateUsers='canUpdateUsers';
}
```

In the `users.ts` file make the following adjustments:
```ts {3,14,22,36,37}
import { authorization } from '../common';
import { BoolColumn, Context, DateTimeColumn, EntityClass, IdEntity, ServerFunction, StringColumn, UserInfo } from "@remult/core";
import { Roles } from './roles';

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 3)
                this.name.validationError = 'Name is too short';
        }
    });
    createdDate = new DateTimeColumn();
    isAdmin = new BoolColumn();
    constructor() {
        super({
            name: 'users',
            saving: () => {
                if (this.isNew())
                    this.createdDate.value = new Date()
            },
            allowApiCRUD: Roles.canUpdateUsers,
            allowApiRead: context => context.isSignedIn()
        })
    }
    @ServerFunction({ allowed: true })
    static async signIn(name: string, context?: Context) {
        const u = await context?.for(Users).findFirst(user => user.name.isEqualTo(name));
        if (!u)
            throw "user does not exist";
        const user: UserInfo = {
            id: u.id.value,
            name: u.name.value,
            roles: []
        };
        if (u.isAdmin.value)
            user.roles.push(Roles.canUpdateUsers);
        return authorization.createToken(user);
    }
}
```
* we've added an import for the `Roles` class
* we've added the `isAdmin` column
* we've restricted update operations only for users that have the `canUpdateUsers` role. To read more about different settings of `allowed` see [allowed](allowed.html)
* In the `signIn` process, we've added the `canUpdateUsers` role, for all users that are defined as admins.

Next we'll add the `isAdmin` column to the `UserList.vue` file
```vue {6,7}
<template>
  <div>
    <h2>User List {{ users.length }}</h2>
    <div v-for="user in users" :key="user.id.value">
      <input v-model="user.name.value" />
      <input v-model="user.isAdmin.value" type="checkbox"/>
      admin |
      <button v-on:click="user.save()" v-if="user.wasChanged()">
        Save Changes
      </button>
      created on: {{ user.createdDate.displayValue }}
      <button v-on:click="deleteUser(user)">Delete</button>
    </div>
  </div>
</template>
```

::: tip Testing what we've done so far
Try updating the users, **you'll probably fail**, this is because your not an admin now - no one is :)

So, first sign out, and change the `signIn` logic to make every one admins by making the following change:
```ts {11}
  @ServerFunction({ allowed: true })
  static async signIn(name: string, context?: Context) {
      const u = await context?.for(Users).findFirst(user => user.name.isEqualTo(name));
      if (!u)
          throw "user does not exist";
      const user: UserInfo = {
          id: u.id.value,
          name: u.name.value,
          roles: []
      };
      if (u.isAdmin.value||true)
          user.roles.push(Roles.canUpdateUsers);
      return authorization.createToken(user);
```
Then sign in, make yourself the admin and fix the code back again.

Or - go to the database, and update your row as admin.
:::


## Update Password
The update password, is an interesting process, since it has several challenges:
1. The password must be protected and can never be included in the api
2. We want the user to type in a password and a confirm password.
3. We want all sorts of validations to be applied both on the server and the browser.

To do that we'll use something called `@ServerController`. 

Server controllers are classes that move between the browser and the server, with their context, when executed.

First, we'll add the `password` column to the `users.ts`
```ts {11-13}
@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 3)
                this.name.validationError = 'Name is too short';
        }
    });
    createdDate = new DateTimeColumn();
    isAdmin = new BoolColumn();
    password = new StringColumn({
        includeInApi: false
    })
    constructor() {
```

Next we'll add a new file in the `src/users` folder, called `updatePasswordController.ts`
```ts {4-7,9,13-16,18}
import { Users } from '../users/users';
import { Context, ServerController, ServerMethod, StringColumn } from "@remult/core";

@ServerController({
    allowed:context=>context.isSignedIn(),
    key:'updatePassword'
})
export class UpdatePasswordController {
    constructor(private context: Context) {
    }
    password = new StringColumn();
    confirmPassword = new StringColumn({
        validate: () => {
            if (this.password.value != this.confirmPassword.value)
                this.password.validationError = "Password doesn't match the confirm password";
        }
    });
    @ServerMethod()
    async SavePassword() {
        const u = await this.context.for(Users).findId(this.context.user.id);
        u.password.value = this.password.value;
        await u.save();
    }
}
```
* Note the `@ServerController` decorator, the determines the `key` that'll be used in the api, and the rule for who is allowed to run this.
* Note that the `context` object is passed in as a parameter to the constructor - on the server, it'll be injected with the server context object.
* Note that the validation logic will be executed both on the server and in the browser
* Note the `@ServerMethod` decorators, that determines which methods will be executed on the server

Next we'll need to register the controller in the `server.ts`
```ts
...
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import { authorization } from '../common';
import '../users/users';
import '../users/updatePasswordController';
```

Now you'll see in the `node-serve` terminal window a new api entry for this controller
```{4}
2:42:03 PM - Found 0 errors. Watching for file changes.
start verify structure
/api/signIn
/api/updatePassword/SavePassword
/api/users
```

### Adding the UpdatePassword.vue file
in the `src/components` folder add a file called `UpdatePassword.vue`
```vue {5,26}
<template>
  <div>
    <h2>Update Password</h2>
    <input
      v-model="controller.password.value"
      placeholder="password"
      type="password"
    />
    <input
      v-model="controller.confirmPassword.value"
      placeholder="confirm password"
      type="password"
    />
    <button v-on:click="updatePassword">Update Password</button>
  </div>
</template>

<script lang="ts">
import { context } from "@/common";
import router from "@/router";
import { Component, Vue } from "vue-property-decorator";
import { UpdatePasswordController } from "../users/updatePasswordController";

@Component
export default class UpdatePasswordView extends Vue {
  controller = new UpdatePasswordController(context);
  async updatePassword() {
    await this.controller.SavePassword();
    alert("Password saved");
  }
}
</script>
```

* note that we data bind directly to the controller

#### Add UpdatePassword route
In the `router.ts` file
```ts {17-20}
const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/users',
            component: () => import("./components/UserList.vue")
        },
        {
            path: '/sign-in',
            component: () => import("./components/SignIn.vue")
        },
        {
            path: '/update-password',
            component: () => import("./components/UpdatePassword.vue")
        },
        {
            path: '/add-user',
            component: () => import("./components/AddUser.vue")
        }
    ]
});
```
#### Add "Change Password" link in the App.vue file

```vue {11-13}
<template>
  <div id="app">
    <h1>Remult with Vue</h1>
    <nav>
      <router-link to="/users">User List</router-link>
      | <router-link to="/add-user">Add User</router-link> 
      | <router-link to="/sign-in" v-if="!context.isSignedIn()">
        Sign In
      </router-link>
      <span v-if="context.isSignedIn()"> Hello {{ context.user.name }} </span>
      | <router-link to="/update-password" v-if="context.isSignedIn()"> 
          Update Password
        </router-link> |
      <button v-if="context.isSignedIn()" v-on:click="signOut">Sign Out</button>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>
```

::: tip Testing what we've done so far
Now you can play around with the change password functionality, test the validation and different user privileges
:::
