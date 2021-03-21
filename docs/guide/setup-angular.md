# Setup for Angular

This tutorial uses the angular cli project template as a starting point. 
It assumes that you have some angular experience

## Create the Angular Project
We'll run the following command:
```sh
ng new --style=scss --routing=true  angular-sample
```
* we set the `--routing` flag to add routes to the angular code, we don't need it for this demo, but you'll probably need it for an actual project
* we set the styles to scss, but you can set it to anything you want

::: tip 
We only added these command line arguments, so that angular will not ask you a bunch of questions :)
:::

### Additional angular configurations
We'll add the angular `FormsModule` to the `app.module.ts` file to enable `[(ngModel)]` data binding:
```ts{6,14}
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

#### Add General Error Handler
To make it easier to see errors, we want to display them in an alert.

We'll add a file called `src/app/common/error-handler.ts`
```ts
import { ErrorHandler, Injectable } from '@angular/core';
@Injectable()
export class DisplayAlertErrorErrorHandler extends ErrorHandler {
   
    async handleError(error) {
        let message = error.message;
        if (error.rejection){
            message = error.rejection.message;
        }
        alert(message);
        super.handleError(error);
    }
}
```
And we'll add it to the `app.module.ts` file:
```ts{2,7,18,19,20}
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DisplayAlertErrorErrorHandler } from './common/error-handler';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: DisplayAlertErrorErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

#### Clean the AppComponent
Replace the content of the `app.component.html` file with the following `html`
```html
<h1>Angular Remult Sample </h1>
```
## Setup Remult
### Install the Server components
Now we'll add the server functionality to the same project.

```sh
npm i express express-force-https jsonwebtoken compression pg reflect-metadata @types/pg @remult/core @remult/server @remult/server-postgres tsc-watch dotenv
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
create a folder called `server` under the `src/app` folder, and in it add a file called `server.ts` with the following code
```ts
import * as express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import '../app.module';

config(); //loads the configuration from the .env file
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    throw "No DATABASE_URL environment variable found, if you are developing locally, please add a '.env' file with DATABASE_URL='postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE*'";
}
const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.DISABLE_POSTGRES_SSL ? false : { rejectUnauthorized: false }
});
let database = new SqlDatabase(new PostgresDataProvider(pool));
new PostgresSchemaBuilder(database).verifyStructureOfAllEntities().then(() => {
    //once the database is ok and all tables are created, setup the express code
    let app = express();
    let s = initExpress(app, database, process.env.DISABLE_HTTPS == "true");
    app.use(express.static('dist/angular-sample'));
    app.use('/*', async (req, res) => {
        res.send(fs.readFileSync('dist/angular-sample/index.html').toString());
    });
    let port = process.env.PORT || 3002;
    app.listen(port);
});
```

* Note that the project name `angular-sample` is mentioned twice in this code, if you use a different project name, change it there.

### Add tsconfig.server.json
Next to the existing `tsconfig.json` we'll add a new `tsconfig` file for the server project. in the root directory add a file called `tsconfig.server.json` and place the following content in it.
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/server",
    "module": "commonjs",
    "target": "es5",
    "skipLibCheck": true,
    "emitDecoratorMetadata": true
  },
  "files": [
    "./src/app/server/server.ts"
  ]
}
```

### Exclude server from the `tsconfig.app.json`
```JSON{5}
...
"exclude": [
  "src/test.ts",
  "src/**/*.spec.ts",
  "src/app/server/**"
]
```

### Add a proxy configuration
In production both the static html (generated by angular) and the data from the api will be served from the same server they will share the same url.

During development we'll need to configure the angular cli so that any call to the `api` directory will be forwarded to our `node` server for it's data.

We'll add a file next to the `angular.json` file called `proxy.conf.json`:
```json
{
    "/api": {
        "target": "http://localhost:3002",
        "secure": false,
        "debug": true
    }
}
```


And in the `angular.json` file we'll add in the `serve` / `options` section - a reference to the `proxy.conf.json` file:

```json{5}
"serve": {
    "builder": "@angular-devkit/build-angular:dev-server",
    "options": {
      "browserTarget": "angular-sample:build",
      "proxyConfig": "proxy.conf.json"
    },
    "configurations": {
      "production": {
          "browserTarget": "angular-sample:build:production"
      }
    },
},
```
### configure the scripts in package.json
```json{4}
  "scripts": {
    "ng": "ng",
    "start":"node dist/server/server/server.js",
    "build": "ng build && tsc -p tsconfig.server.json",
    "dev-ng": "ng serve",
    "dev-node": "./node_modules/.bin/tsc-watch -p tsconfig.server.json --onSuccess \"npm run start\"",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
  },
```
* We changed the `start` script to start the `node` server is we'll do in production.
* we changed the `build` script to also built to server
* We've added the `dev-ng` and `dev-node` scripts to run the angular cli dev server and the node server respectively






### Configure the remult context
The remult `Context` object is responsible for most of the server interactions, it helps extract data from the db, identify the current application user and their roles etc...

To configure angular to be able to inject it, we'll add a `provider` for it in the `app.module.ts` file:

```ts{8,21}
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DisplayAlertErrorErrorHandler } from './common/error-handler';
import { Context } from '@remult/core';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: DisplayAlertErrorErrorHandler },
    { provide: Context, useClass: Context }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

```


### Run the Project
We'll run two terminal windows
1. Vue Dev Server - `npm run dev-ng`
2. Node Server - `npm run dev-node`


::: tip  Optional Tip - Configuring tasks in vscode
If you are using vs code, you might find it useful to configure the `dev-ng` and the `dev-node` as vscode tasks, and see them as a split screen in the terminal window.

To do that, add the following tasks configuration to the `tasks.json` file
```json
{
    "type": "npm",
    "script": "dev-ng",
    "problemMatcher": [
        "$tsc-watch"
    ],
    "label": "npm: dev-ng",
    "detail": "Angular Cli Dev Server",
    "isBackground": true,
    "presentation": {
        "group": "dev"
    }
},
{
    "type": "npm",
    "script": "dev-node",
    "problemMatcher": [
        "$tsc-watch"
    ],
    "label": "npm: dev-node",
    "detail": "Node Dev Server",
    "isBackground": true,
    "presentation": {
        "group": "dev"
    }
},
{
    "label": "dev",
    "dependsOn": [
        "npm: dev-ng",
        "npm: dev-node"
    ],
    "detail":"runs both dev-ng and dev-node",
    "problemMatcher": [
    ],
    "isBackground": true
}
```

Then you can simply run the task called 'dev'
:::






## Entities
The first advantage that `remult` provides is the ability to define an entity once, and use the same code both on the server and in the browser.
The Api, Database and communication are all derived from that one definition of an entity.

Add a folder called `src/app/tasks` and in it adda file called `tasks.ts` with the following code
```ts
import { EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: 'tasks',
            allowApiCRUD: true,
        })
    }
}
```

The first thing we'll want to do with the `Tasks` entity is to allow the user to add a task.

To do that we'll edit the `app.component.ts` file:
```ts{2,3,11,12,13,14,15,16,17}
import { Component } from '@angular/core';
import { Context } from '@remult/core';
import { Tasks } from './tasks/tasks';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private context: Context) {
  }
  newTask = this.context.for(Tasks).create();
  async addNewTasks() {
    await this.newTask.save();
    this.newTask = this.context.for(Tasks).create();
  }
}
```

And the `app.component.html`
```html
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<button (click)="addNewTasks()">Add New Task</button>
```

* We've added the remult `Context` in the constructor.
* We've used it to create a new `Tasks` object.
* When the user clicks the add new task button, we'll call the `addNewTask` method and it'll save the new task to the server and replace the value in the `newTask` with another new task.


As soon as we save these files, we'll see in the terminal window of the node server `dev-node` that a `create table` script was added and an api endpoint called `tasks` was created.
```sh{7,8,9,10,11}
12:52:57 PM - Found 0 errors. Watching for file changes.

> angular-sample@0.0.0 start C:\Repos\angular-sample
> node dist/server/server/server.js

start verify structure
create table tasks (
  id varchar default '' not null  primary key,
  name varchar default '' not null
)
/api/tasks
```

::: tip Run and try it
Add a few new tasks using the ui, and see that they are added by viewing the result returned by the api at `http://localhost:4200/api/tasks` or by looking at the database using sql tools.
:::

### Display the existing tasks
To display the existing tasks, we'll adjust the `app.component.ts` accordingly:
```ts{4,5,6,7,8,9,10,15}
export class AppComponent {
  constructor(private context: Context) {
  }
  tasks: Tasks[];
  async loadTasks() {
    this.tasks = await this.context.for(Tasks).find();
  }
  ngOnInit() {
    this.loadTasks();
  }
  newTask = this.context.for(Tasks).create();
  async addNewTasks() {
    await this.newTask.save();
    this.newTask = this.context.for(Tasks).create();
    this.loadTasks();
  }
}
```
`app.component.html`
```html{4,5,6,7,8}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<button (click)="addNewTasks()">Add New Task</button>
<ul>
    <li *ngFor="let task of tasks">
        {{task.name.value}}
    </li>
</ul>
```

* we've added an array of tasks.
* We've added a `loadTasks` method to populate that array
* we've added the `ngOnInit` method that is called once the component is loaded, and added a call to the `loadTasks` method.
* after a new task is added, we call the `loadTasks` method again to reload the tasks.

::: tip Run and try it
New you can see that as you add tasks, these appear in the list immediately
:::


::: tip Ready for production
The application as it is now is ready to be deployed to production.

If you want to deploy it to `heroku` for example, after you install the heroku cli and sign in you'll need to:
1. commit your changes to git.
2. create an app on heroku `heroku apps:create`
3. Provision a database `heroku addons:create heroku-postgresql:hobby-dev`
4. Deploy to heroku using git `git push heroku master -f`

Once it's done simply run the app using: `heroku apps:open`
:::

### Allowing the user to delete a task
In the `app.component.ts` add the following code:
```ts
async deleteTask(task:Tasks){
    await task.delete();
    this.loadTasks();
  }
```

In the `app.component.html`
```html{7}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<button (click)="addNewTasks()">Add New Task</button>
<ul>
    <li *ngFor="let task of tasks">
        {{task.name.value}}
        <button (click)="deleteTask(task)">Delete</button>
    </li>
</ul>
```


### Allowing the user to edit a Task
In the `app.component.html` 
```html{6,7,8}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<button (click)="addNewTasks()">Add New Task</button>
<ul>
    <li *ngFor="let task of tasks">
        <input [(ngModel)]="task.name.inputValue">
        <button (click)="task.save()" 
        [disabled]="!task.wasChanged()">Save</button>
        <button (click)="deleteTask(task)">Delete</button>
    </li>
</ul>
```
* We've replaced the text with an input to allow the user to edit the task.
* we've added a save button, to save the changes using the `save` method ot the `Tasks`.
* We've made the button disabled if the task was not changed by using the `wasChanged` method of the `tasks`.


### Adding validation
Normally when you write an application a lot of your logic is spread across different files and pieces of code. For example you may have validation logic both in the front end code, and on the server for api calls.

In remult we encourage you to encapsulate that logic in one place - in the entity.

Since the same entity code is used both on the server, the browser and the api, placing the validation login there helps save a lot of errors and duplications.

In the `tasks.ts` file we'll make the following change:

```ts{6,7,8,9}
import { EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'task name is too short';
        }
    });
    constructor() {
        super({
            name: 'tasks',
            allowApiCRUD: true,
        })
    }
}
```
::: tip Run and try it
1. Try adding a task with a short name
2. Try editing an existing task changing it's name to a short name.
3. You can call the api directly using a tool like `postman` or just running the following code in the `console` window of the browser and you'll see that the validation also happens on the server side:
```js
await fetch("http://localhost:4200/api/tasks", {
  "headers": {    "content-type": "application/json"},
  "body": "{\"name\":\"2\"}",
  "method": "POST"
}).then(r=>r.json())
```
:::



## todo
[] decide if on the setup of angular, we avoid the command line args, and let them decide whatever they want

[] consider adding the jsonwebtoken package as a dependency of `@remult/server`

[] consider renaming postgres to postgresql all over the code (not sure because when you create a db it's name by default is postgres)

[] Investigate why in the first stage the vendor bundle size is 4mb

[] Reconsider the Context Injection to use angular http client instead of nothing is it does right now. maybe even consider creating an AppContext and do something with it~~

[] reconsider the find limit - currently it's set by default to 25 and that can cause problems.

[] reconsider separating the setup code - to something the user can extract from a github template - and only worry about the setup if they want to.

[] document the constructor parameters of column