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
    initExpress(app, database, process.env.DISABLE_HTTPS == "true");
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
<input [(ngModel)]="newTask.name.inputValue">
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

If you want to deploy it to `heroku` for example, after you install the heroku cli and sign in you'll need to run the following commands in the terminal window:

**Setup the site once**
1. create an app on heroku `heroku apps:create`
2. Provision a database `heroku addons:create heroku-postgresql:hobby-dev`

**Every time you want to update the site**
1. commit your changes to git.
2. Deploy to heroku using git `git push heroku master -f`

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
<input [(ngModel)]="newTask.name.inputValue">
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
* We've replaced the text with an input to allow the user to edit the task. Note that we bind the `inputValue` field to the input. We use the `inputValue` field, because it handles the different inputs that are provided by html and translates them to the value in the `column`. It's less important for strings, but it's more significant in the cases where you use date or number or boolean.
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

#### Displaying the validation error
We can use the column's `validationError` field to display the validation error to the user next to the relevant input.
in the `app.component.html`
```html{3,8}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<span style="color:red">{{newTask.name.validationError}}</span>
<button (click)="addNewTasks()">Add New Task</button>
<ul>
    <li *ngFor="let task of tasks">
        <input [(ngModel)]="task.name.inputValue">
        <span style="color:red">{{task.name.validationError}}</span>
        <button (click)="task.save()" 
        [disabled]="!task.wasChanged()">Save</button>
        <button (click)="deleteTask(task)">Delete</button>
    </li>
</ul>
```

::: tip Run and try it
1. Try adding a task with a short name
2. Try editing an existing task changing it's name to a short name.
3. You can call the api directly using a tool like `postman` or just running the following code in the `console` window of the browser and you'll see that the validation also happens on the server side:
```js
await fetch("http://localhost:4200/api/tasks", {
  "headers": {"content-type": "application/json"},
  "method": "POST",
  "body": "{\"name\":\"2\"}"
}).then(r=>r.json())
```
:::


## Add a column to the Entity
We want to add a `completed` column to the tasks, indicating that a task has been completed.

We'll edit the `tasks.ts` file:
```ts{9}
@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'task name is too short';
        }
    });
    completed = new BoolColumn();
    constructor() {
        super({
            name: 'tasks',
            allowApiCRUD: true,
        })
    }
}
```

In the `app.component.html` 
```html{7,8,9}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.value">
<span style="color:red">{{newTask.name.validationError}}</span>
<button (click)="addNewTasks()">Add New Task</button>
<ul>
    <li *ngFor="let task of tasks">
        <input [(ngModel)]="task.completed.inputValue" type="checkbox">
        <input [(ngModel)]="task.name.inputValue"
          [style.textDecoration]="task.completed.value?'line-through':''">
        <span style="color:red">{{task.name.validationError}}</span>
        <button (click)="task.save()" 
        [disabled]="!task.wasChanged()">Save</button>
        <button (click)="deleteTask(task)">Delete</button>
    </li>
</ul>
```
* We've added an input for the `completed` column and used the `inputValue` as it's model
* We've added a style condition, to add a line-through in case a task is completed

## Sorting the tasks
We want to show the uncompleted tasks before the completed once.
In the `loadTasks` method in the  `app.component.ts` file:
```ts{2,3,4}
async loadTasks() {
    this.tasks = await this.context.for(Tasks).find({
      orderBy: task => task.completed
    });
  }
```
## Filtering the tasks
We want to allow the user to hide completed tasks.
In the `app.component.html` we'll add the following lines:
```html{5,6}
<h1>Angular Remult Sample </h1>
<input [(ngModel)]="newTask.name.inputValue">
<span style="color:red">{{newTask.name.validationError}}</span>
<button (click)="addNewTasks()">Add New Task</button>
<br>
<input type="checkbox" [(ngModel)]="hideCompleted" (change)="loadTasks()">Hide Completed
<ul>
    <li *ngFor="let task of tasks">
...
```

In the `app.component.ts`
```ts{5,8}
...
  constructor(private context: Context) {
  }
  tasks: Tasks[];
  hideCompleted: boolean;
  async loadTasks() {
    this.tasks = await this.context.for(Tasks).find({
      where: task => this.hideCompleted ? task.completed.isEqualTo(false) : undefined,
      orderBy: task => task.completed,
    });
  }
...
```

## Changing values from code
Sometimes we want to change the values of columns from code - in our case we would like to add two buttons: `Set All as Completed` and `Set all as UnCompleted`.

In the `app.component.html` we'll add the following buttons:
```html
<button (click)="setAll(true)">Set all as Completed</button> 
&nbsp;
<button (click)="setAll(false)">Set all as UnCompleted</button>
```
In the `app.component.ts` file we'll add the `setAll` method:
```ts{2,3,4,5,6,7,8}
...
  async setAll(completed: boolean) {
      for await (const task of this.context.for(Tasks).iterate()) {
        task.completed.value = completed;
        await task.save();
      }
      this.loadTasks();
  }

```
* Note that we've used the `iterate` method as it is more robust and has a built in paging mechanism that is designed to handle large number of objects. The `iterate` method doesn't return an array like the `find` method, instead it returns an `iteratable` object that works with the javascript `for await` commands.

### moving the logic to the Server
In cases where there are hundreds of tasks, this method of iterating them in the browser and updating them one by one can take considerable amount of time.

If this code would run on the server, we would get better results.

One of the main benefits of using `remult` is that the change from having this code run in the browser to having it run in the server is very simple.
We'll make the following changes to the `app.component.ts` file:
```ts{2,5,6,7,8,9,10,11}
  async setAll(completed: boolean) {
    await AppComponent.setAll(completed);
    this.loadTasks();
  }
  @ServerFunction({ allowed: true })
  static async setAll(completed: boolean, context?: Context) {
    for await (const task of context.for(Tasks).iterate()) {
      task.completed.value = completed;
      await task.save();
    }
  }
```

* We've created a `static` method and decorated it with the `@ServerFunction` decorator.
* We've sent it `allowed:true` for permission control - we'll handle these later in this tutorial, but for now we are allowing anyone to run it.
* We've defined a new parameter called `context?: Context` that is automatically injected with the correct context on the server.
::: error 
explain that the call to the server is type safe in the sense that it gets compile time type validation that no other tool provides.
:::

That's it - now this code runs on the serer - it uses the same language, the same code objects and just runs a lot faster.

## Securing the Application
A critical part of any web application, is making sure that only authorized users can use an application, and that each request is coming from the correct user.

After the user Signs In, we need to include their information for each request, and to make sure that it's indeed that user that is making the request.

For that we'll use a technology called JWT that provides us with a token that includes the user information and makes sure that that information was not altered. [See Jwt](https://jwt.io/).

Here's how it's going to work:
1. When the user signs in on the server, it'll generate a token using a secret hash key that only the server knows.
2. Once the browser get's that token, it'll store it in a cookie and include it in each following request.
3. Whenever a request reaches the server, it'll validate that info in the token, using the secret hash key, and will accept the request only if they match.

This way the browser and server can share and trust that user info.

* In angular, you can access the user info, using the `user` property of the `context` object.

### Introducing JWT authorization to the project

#### Step 1, add the secret hash key to .env

in the `.env` file
```
TOKEN_SIGN_KEY='My very very secret key'
```
::: warning
In production use a completely random string, you can generate one using: [Online UUID Generator
](https://www.uuidgenerator.net/version4)
:::

::: tip Deployment to heroku
You'll need to set the `TOKEN_SIGN_KEY` value on heroku as well, you can do that via the heroku ui, or using command line:
```sh
heroku config:set TOKEN_SIGN_KEY=Some very secret key you've generated
```
:::

#### Step 2, add the `JwtSessionService` to the `app.module.ts`
```ts{4}
...
  providers: [
    { provide: ErrorHandler, useClass: DisplayAlertErrorErrorHandler },
    { provide: JwtSessionService, useClass: JwtSessionService, deps: [Context] },
    { provide: Context, useClass: Context }
  ],
...
```

### Now that we're all setup, let's use it
In the `app.component.ts` make the following changes:
```ts{2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,22,23}
export class AppComponent {
  constructor(public context: Context, public session: JwtSessionService) {
  }
  @ServerFunction({ allowed: true })
  static async signIn(name: string) {
    switch (name) {
      case "Jane":
        return JwtSessionService.createTokenOnServer({ id: '1', name: name, roles: [] });
      case "Steve":
        return JwtSessionService.createTokenOnServer({ id: '2', name: name, roles: [] });
      default:
        throw "Invalid User";
    }
  }
  username: string;
  async signIn() {
    this.session.setToken(await AppComponent.signIn(this.username));
  }
  tasks: Tasks[];
  hideCompleted: boolean;
  async loadTasks() {
    if (!this.context.isSignedIn())
      return;
    this.tasks = await this.context.for(Tasks).find({
      orderBy: task => task.completed,
      where: task => this.hideCompleted ? task.completed.isEqualTo(false) : undefined
    });
  }
...
```
* We've added the `JwtSessionService` to the constructor, and made both it and `context` public so that we can use them in our `html`
* We've added a `@ServerFunction` called `signIn` that validates the user, and if the user is valid returns a JWT token that contains that user information.
  For now we've used hard coded user names, later you can replace it with database values.
* We've added a member called `username` and a `signIn` method for the Sign In process. It calls the `signIn` server function, and sends the result token to the JwtSessionService` to store and manage
* We've disabled the `loadTasks` method if he user is not signed in.

In the `app.component.html` file:
```html {2,3,4,5,6,7,27}
<h1>Angular Remult Sample </h1>
<ng-container *ngIf="!context.isSignedIn()">
    <input [(ngModel)]="username"> <button (click)="signIn()">Sign In</button>
</ng-container>
<ng-container *ngIf="context.isSignedIn()">
    Hello {{context.user.name}}
    <button (click)="session.signout()">Sign Out</button><br/>
    <input [(ngModel)]="newTask.name.inputValue">
    <span style="color:red">{{newTask.name.validationError}}</span>
    <button (click)="addNewTasks()">Add New Task</button>
    <br>
    <input type="checkbox" [(ngModel)]="hideCompleted" (change)="loadTasks()">Hide Completed
    <ul>
        <li *ngFor="let task of tasks">
            <input [(ngModel)]="task.completed.inputValue" type="checkbox">
            <input [(ngModel)]="task.name.inputValue"
            [style.textDecoration]="task.completed.value?'line-through':''">
            <span style="color:red">{{task.name.validationError}}</span>
            <button (click)="task.save()" 
            [disabled]="!task.wasChanged()">Save</button>
            <button (click)="deleteTask(task)">Delete</button>
        </li>
    </ul>
    <button (click)="setAll(true)">Set all as Completed</button> 
    &nbsp;
    <button (click)="setAll(false)">Set all as UnCompleted</button>
</ng-container>
```
* We've added two `ng-container` that display data based on the `signed in` status.
* We've added an input and button to sign in, and one to sign out
  


## Securing the API
So far we changed the UI to hide the tasks if the user is not signed in, but for any web application it's crucial to secure the API itself - otherwise anyone can access the api directly and gain access to sensitive information.

We want to prevent users from accessing the `tasks` entity and also prevent them from running the relevant `@ServerFunctions`

To do that we'll edit the `tasks` entity to only allow `CRUD` for signed in users.
```ts{15}
import { BoolColumn, EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'task name is too short';
        }
    });
    completed = new BoolColumn();
    constructor() {
        super({
            name: 'tasks',
            allowApiCRUD: context => context.isSignedIn(),
        })
    }
}
```
This will only allow access to the `Tasks` class for signed in users.

In the `app.component.ts` file we'll secure the `setAll` server function
```ts{1}
@ServerFunction({ allowed: context => context.isSignedIn() })
static async setAll(completed: boolean, context?: Context) {
  for await (const task of context.for(Tasks).iterate()) {
    task.completed.value = completed;
    await task.save();
  }
}
```

## Using Roles
Most real world application have different types of users with different privileges - these privileges are managed using `roles`.

In this app we want to distinguish to type of users.
1. All signed in users can see the tasks
2. All signed in users can set `completed` to specific tasks.
3. Only users with `admin` role can create, delete or edit the name of tasks.
4. Only users with `admin` role can mark all tasks as completed.

First we'll start by adding a file called `roles.ts` in the `src/app` folder
```ts
export class Roles {
    static admin = 'admin';
}
```

Next we'll edit the `tasks.ts` file to reflect the behavior we want:
```ts{2,11,17,18,19,20}
import { BoolColumn, EntityClass, IdEntity, StringColumn } from "@remult/core";
import { Roles } from "../roles";

@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'task name is too short';
        },
        allowApiUpdate: Roles.admin
    });
    completed = new BoolColumn();
    constructor() {
        super({
            name: 'tasks',
            allowApiRead: context => context.isSignedIn(),
            allowApiUpdate: context => context.isSignedIn(),
            allowApiInsert: Roles.admin,
            allowApiDelete: Roles.admin
        })
    }
}
```


Now we need to adjust the `signIn` method to assign the admin role to one of the users.
In the `app.component.ts`
```ts{5}
  @ServerFunction({ allowed: true })
  static async signIn(name: string) {
    switch (name) {
      case "Jane":
        return JwtSessionService.createTokenOnServer({ id: '1', name: name, roles: [Roles.admin] });
      case "Steve":
        return JwtSessionService.createTokenOnServer({ id: '2', name: name, roles: [] });
      default:
        throw "Invalid User";

    }
  }
```

## Recording the completing user
```ts{11,12,13,14,15,16,17,20,21,22,23,24,25,26,27}
@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'task name is too short';
        },
        allowApiUpdate: Roles.admin
    });
    completed = new BoolColumn();
    completedUser = new StringColumn({
        allowApiUpdate: false
    })
    completedTime = new DateTimeColumn({
        allowApiUpdate: false
    })
    constructor(context: Context) {
        super({
            name: 'tasks',
            saving: () => {
                if (context.onServer) {
                    if (this.completed.value != this.completed.originalValue) {
                        this.completedUser.value = context.user.name;
                        this.completedTime.value = new Date();
                    }
                }
            },
            allowApiRead: context => context.isSignedIn(),
            allowApiUpdate: context => context.isSignedIn(),
            allowApiInsert: Roles.admin,
            allowApiDelete: Roles.admin
        })
    }
}
```
* We've added the `completedUser` and `completedTime` column and marked then as `allowApiUpdate:false` so that they can only be updated by the server and can be trusted.
* We've added the `context` to the constructor, the correct `context` object will be injected when the code executes. 
* We've added logic in the `saving` event. This event is fired both in the browser and in the server, we use the `context.onServer` to conditionally run this code only on the server



## todo
[] finish release of remult after jwt changes introduced in v2.2.1

[] Reconsider the Context Injection to use angular http client instead of nothing is it does right now. maybe even consider creating an AppContext and do something with it~~

[] extract from init express the usage of compression, secure etc... and make the JwtAuthentication recieve a authenticate provider interface that is simple and is implemented with the jwt. make JWTCookieAuthorizationHelper internal and only get sign and validate in the interface.

[] Investigate why in the first stage the vendor bundle size is 4mb


[] reconsider the find limit - currently it's set by default to 25 and that can cause problems.

[] reconsider separating the setup code - to something the user can extract from a github template - and only worry about the setup if they want to.

[] document the constructor parameters of column


[] consider code that decodes jwt in jwt-session-service

[] fix server ts to remove the then and create the entities in a simple line.