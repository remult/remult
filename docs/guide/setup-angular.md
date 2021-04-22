# Todo App with Angular
### Build a production ready task list app with Remult using Angular + Node/Express/Postgres

In this tutorial we are going to create a simple app to manage a task list. We'll use Angular for the UI, Express for the API server, a and Remult as our full stack framework. For deployment to production, we'll use Heroku and a PostgreSQL database. By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `Angular`.

Before you begin, make sure you have [Node.js](https://nodejs.org/en/) installed. <!-- consider specifying Node minimum version with npm -->


## Create a Project
We'll start by creating an Angular project, so if Angular CLI is not already installed - then install it.
```sh
npm i -g @angular/cli
```
### Create an Angular Project
Create the new Angular project.
```sh
ng new angular-sample
```
::: warning Note
The ng new command prompts you for information about features to include in the initial app project. Accept the defaults by pressing the Enter or Return key.
:::

### Adding Remult and Server Stuff
In this tutorial we'll be using the project folder created by `Angular` as the root folder for our server project as well.
```sh
cd angular-sample
```
#### Installing required modules
We need `express` to serve our app's API and, of course, `remult`.
```sh
npm i express @remult/core
```
#### The server project

1. Create a `server` folder under the `src/` folder. 
   ```sh
   cd src
   md server
   cd..
   ```

2. In the project root folder, create a TypeScript config file `tsconfig.server.json` for the server project.

   *tsconfig.server.json*
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
      "include": [
         "src/server/*.ts"
      ]
   }
   ```
#### Main server module
The main server module initializes `Express`, starts Remult by calling `initExpress` and begins listening for API requests.

Create an `index.ts` file in the `src/server/` folder with the following code:

*src/server/index.ts*
```ts
import * as express from 'express';
import { initExpress } from '@remult/core/server';
import '../app/app.module';

let app = express();
initExpress(app);
app.listen(3002);
```

::: warning Note
Remult creates RESTful API endpoints based on decorators in the application code. Importing the Angular `../app/app.module` in the main server module **ensures all the decorators used in our app are found by Remult**.

Sure, this means the entire Angular app is loaded on the server-side, but that's a small price to pay for keeping our code simple.
:::

### Setting up an Angular DI Provider for Remult
Our Angular starter project is almost ready. All that's left is to add a dependency injection provider for the `Remult` `Context` object. The `Context` object provided will be used to communicate with the API server.

This requires making the following changes to `app.module.ts`:
1. Import Angular's [HttpClientModule](https://angular.io/api/common/http/HttpClientModule)
2. Add an Angular `provider` for the `Context` object, which depends on Angular's `HttpClient` object

While we're editing the root Angular module, we can also import the `FormsModule` which we'll need later in order to use the [ngModel](https://angular.io/api/forms/NgModel) two-way binding directive.

*src/app/app.module.ts*
```ts{5-7,15-16,19}
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Context } from '@remult/core';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: Context, useClass: Context, deps: [HttpClient] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Finishing up the Starter Project

#### Proxy API requests from Webpack DevServer to Node
The Angular app created in this tutorial is intended to be served from the same domain as its API. 
However, during development, the API server will be listening on `http://localhost:3002`, while the Angular app is served from `http://localhost:4200`. 

We'll use the [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) feature of webpack dev server to divert all calls for `http://localhost:4200/api` to our dev API server.

Create a file `proxy.conf.json` in the project folder, with the following contents:

*proxy.conf.json*
```json
{
    "/api": {
        "target": "http://localhost:3002",
        "secure": false
    }
}
```
#### Install server dev tools
In our development environment we'll use `ts-node-dev` to run the API server.
```sh
npm i ts-node-dev --save-dev
```

#### Configure scripts in package.json
In this tutorial we'll use the following `npm` scripts:
* The `start` script runs the production server
* The `build` script builds the Angular app and transpiles the server TypeScript code
* The `dev-node` script runs the dev Node/Express API server
* The `dev-ng` script runs the Angular dev server

*package.json*
```json{4-7}
...
  "scripts": {
    "ng": "ng",
    "start": "node dist/server/server/index.js",
    "build": "ng build && tsc -p tsconfig.server.json",
    "dev-ng": "ng serve --open --proxy-config proxy.conf.json",
    "dev-node": "ts-node-dev --project tsconfig.server.json src/server/index.ts",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
  }
...
```

#### Run the starter project
Open two terminals and run the `dev-node` and `dev-ng` scripts in parallel. 

The default Angular app main screen should be displayed.

::: tip
If you are using Visual Studio Code and would like to run both `dev-node` and `dev-ng` scripts using a single Visual Studio Code `task`, create a `.vscode/tasks.json` file with the contents found [here](https://gist.github.com/noam-honig/623898a6cd539d86113263d3c63260f0) and run the `dev` task.
:::

## Entities

Now that our starter project is ready, we can start coding the app by defining the `Tasks` entity class.

The `Tasks` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints and database commands

The `Tasks` entity class we're creating will have an `id` field and a `title` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

Create a file `tasks.ts` in the `src/app/` folder, with the following code:

*src/app/tasks.ts*
```ts
import { EntityClass, IdEntity, StringColumn } from "@remult/core";

@EntityClass
export class Tasks extends IdEntity {
    readonly title = new StringColumn();
    constructor() {
        super({
            name: 'tasks',
            allowApiCRUD: true
        })
    }
}
```

The `@EntityClass` decorator tells Remult this class is an entity class. <!-- consider linking to reference -->

`IdEntity` is a base class for entity classes, which defines a unique string identifier field named `id`. <!-- consider linking to reference -->

`StringColumn` is a Remult `Column` class for `string` entity fields. **Remult entity fields are `TypeScript` objects, not values.** The main goals of this design are to encapsulate field related properties and operations, and prevent run-time type mismatch errors. Some of these benefits are discussed in the next sections of this tutorial.

The `Entity` class constructor can accept an argument which implements the `EntityOptions` interface. We use an anonymous object to instantiate it, setting the `name` property (used to name the API route and database collection/table), and the `allowApiCRUD` property to `true`.


### Create new tasks

The first feature of our app is letting the user create a new task by typing a task title and clicking a button.

Let's implement this feature within the main `AppComponent` class.

1. Add the highlighted code lines to the `AppComponent` class file:

   *src/app/app.component.ts*
   ```ts{2-3,12-18}
   import { Component } from '@angular/core';
   import { Context } from '@remult/core';
   import { Tasks } from './tasks';

   @Component({
      selector: 'app-root',
      templateUrl: './app.component.html',
      styleUrls: ['./app.component.css']
   })
   export class AppComponent {
      title = 'angular-sample';
      constructor(private context: Context) { 
      }
      newTask = this.context.for(Tasks).create();
      async createNewTask() {
         await this.newTask.save();
         this.newTask = this.context.for(Tasks).create();
      }
   }
   ```

   The `context` field we've add to the `AppComponent` class (using a constructor argument), is a Remult `Context` object which will be instantiated by Angular`s dependency injection.

   The `newTask` field contains a new, empty, instance of a `Tasks` entity object, instantiated using Remult. 
   
   The `createNewTask` method stores the newly created `task` to the backend database (through an API `POST` endpoint handled by Remult), and the `newTask` member is replaced with a new `Tasks` object.

2. Replace the contents of `app.component.html` with the following HTML:

   *src/app/app.component.html*
   ```html
   <title>{{title}}</title>
   <div>
      <input [(ngModel)]="newTask.title.inputValue" [placeholder]="newTask.title.defs.caption">
      <button (click)="createNewTask()">Create new task</button>
   </div>
   ```

   Using the `ngModel` directive, we've bound the `inputValue` property of the new task's `title` field to an `input` element.

   **The `inputValue` property is a `string` property which handles parsing and formatting of entity field values to and from valid `input` values.** This is less of an issue with `string` fields, but is valuable for `Number` or `Boolean` fields.

   For the `placeholder` of the `input` element, we've used the `caption` property of the the `title` field. The default value of the `caption` property is the name of entity class field (i.e. "Title").

### Run and create tasks
Using the browser, create a few new tasks. Then navigate to the `tasks` API route at <http://localhost:4200/api/tasks> to see the tasks have been successfully stored on the server.

::: warning Wait, where is the backend database?
By default, `remult` stores entity data in a backend JSON database. Notice that a `db` folder has been created under the project folder, with a `tasks.json` file that contains the created tasks.

If you're using git, it is advisable to exclude the `db` folder from version control by adding it to the project's `.gitignore` file.
:::


### Display the list of tasks
To display the list of existing tasks, we'll add a `Tasks` array field to the `AppComponent` class, load data from the server, and display it in an unordered list.

1. Add the following code to the `AppComponent` class:

   *src/app/app.component.ts*
   ```ts
   tasks: Tasks[];
   async loadTasks() {
      this.tasks = await this.context.for(Tasks).find();
   }
   ngOnInit() {
      this.loadTasks();
   }
   ```
   The `ngOnInit` hook method loads the list of `Tasks` when the component is loaded.

2. Add the unordered list element to the `app.component.html` file.

   *src/app/app.component.html*
   ```html
   <ul>
      <li *ngFor="let task of tasks">
         {{task.title.value}}
      </li>
   </ul>
   ```

3. To refresh the list of tasks after a new task is created, add a `loadTasks` method call to the `createNewTask` method of the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts{4}
   async createNewTask() {
      await this.newTask.save();
      this.newTask = this.context.for(Tasks).create();
      this.loadTasks();
   }
   ```

After the browser refreshes, the list of `tasks` appears. Create a new `task` and it's added to the list.

### Delete tasks
Let's add a `Delete` button next to each task on the list, which will delete that task in the backend database and refresh the list of tasks.

1. Add the following `deleteTask` method to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   async deleteTask(task: Tasks) {
     await task.delete();
     this.loadTasks();
   }
   ```

2. Add the `Delete` button to task list item element in `app.component.html`.

   *src/app/app.component.html*
   ```html{3}
   <li *ngFor="let task of tasks">
      {{task.title.value}}
      <button (click)="deleteTask(task)">Delete</button>
   </li>
   ```

After the browser refreshes, a `Delete` button appears next to each task in the list. Delete a `task` by clicking the button.

### Making the task titles editable
To make the titles of the tasks in the list editable, let's add an html `input` for the titles, and s `Save` button to save the changes to the backend database. We'll use the `wasChanged` method of the entity class to disable the `Save` button while there are no changes to save.

Replace the task `title` template expression in `app.component.html` with the highlighted lines:

*src/app/app.component.html*
```html{2-3}
<li *ngFor="let task of tasks">
   <input [(ngModel)]="task.title.inputValue">
   <button (click)="task.save()" [disabled]="!task.wasChanged()">Save</button>
   <button (click)="deleteTask(task)">Delete</button>
</li>
```

### Mark tasks as completed
Let's add a new feature - marking tasks in the todo list as completed using a `checkbox`. Titles of tasks marked as completed should have a `line-through` text decoration.

1. Add a `completed` field to the `Tasks` entity class, and initialize it with a new `BoolColumn` object.

   *src/app/tasks.ts*
   ```ts
   readonly completed = new BoolColumn();
   ```

   ::: danger Import BoolColumn
   Don't forget to import `BoolColumn` from `@remult/core` for this code to work.
   :::

2. Add a an html `input` of type `checkbox` to the task list item element in `app.component.html`, and bind its `ngmModel` to the `inputValue` property of the task's `completed` field. 
   
   Set the `text-decoration` style attribute expression of the task `title` input element to evaluate to `line-through` when the value of `completed` is `true`.

   *src/app/app.component.html*
   ```html{2-4}
   <li *ngFor="let task of tasks">
      <input [(ngModel)]="task.completed.inputValue" type="checkbox">
      <input [(ngModel)]="task.title.inputValue" 
         [style.textDecoration]="task.completed.value?'line-through':''">
      <button (click)="task.save()" [disabled]="!task.wasChanged()">Save</button>
      <button (click)="deleteTask(task)">Delete</button>
   </li>
   ```

After the browser refreshes, a checkbox appears next to each task in the list. Mark a few tasks as completed using the checkboxes.

::: tip
To save the change of `task.completed` immediately when the user checks or unchecks the checkbox, simply add a `change` event handler to the checkbox element and call `task.save()`.
:::
### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

Here are the code files we've modified to implement these features.

*src/app/tasks.ts*
```ts
import { EntityClass, IdEntity, StringColumn, BoolColumn } from "@remult/core";

@EntityClass
export class Tasks extends IdEntity {
   readonly title = new StringColumn();
   readonly completed = new BoolColumn();
   constructor() {
      super({
            name: 'tasks',
            allowApiCRUD: true
      })
   }
}
```

*src/app/app.component.ts*
```ts{2-3,12-30}
import { Component } from '@angular/core';
import { Context } from '@remult/core';
import { Tasks } from './tasks';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-sample';
  constructor(private context: Context) {
  }
  newTask = this.context.for(Tasks).create();
  async createNewTask() {
    await this.newTask.save();
    this.newTask = this.context.for(Tasks).create();
    this.loadTasks();
  }
  tasks: Tasks[];
  async loadTasks() {
    this.tasks = await this.context.for(Tasks).find();
  }
  ngOnInit() {
    this.loadTasks();
  }
  async deleteTask(task: Tasks) {
    await task.delete();
    this.loadTasks();
  }
}
```

*src/app/app.component.html*
```html
<title>{{title}}</title>
<div>
  <input [(ngModel)]="newTask.title.inputValue" [placeholder]="newTask.title.defs.caption">
  <button (click)="createNewTask()">Create new task</button>
</div>
<ul>
  <li *ngFor="let task of tasks">
    <input [(ngModel)]="task.completed.inputValue" type="checkbox">
    <input [(ngModel)]="task.title.inputValue" [style.textDecoration]="task.completed.value?'line-through':''">
    <button (click)="task.save()" [disabled]="!task.wasChanged()">Save</button>
    <button (click)="deleteTask(task)">Delete</button>
  </li>
</ul>
```

## Sorting and Filtering
The RESTful API create by Remult supports server-side sorting and filtering. Let's use that sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `loadTasks` method of the `AppComponent` class, modify the `find` method call to include an `options` argument which implements the `FindOptions` interface. Implement the interface using an anonymous object and set the object's `orderBy` property to an arrow function which accepts an argument of the `Task` entity class and returns its `completed` column.

*src/app/app.component.ts*
```ts{2-4}
async loadTasks() {
  this.tasks = await this.context.for(Tasks).find({
    orderBy: task => task.completed
  });
}
```

By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.

### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   hideCompleted: boolean;
   ```

2. In the `loadTasks` method of the `AppComponent` class, set the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter if the `hideCompleted` field is `true`.

   *src/app/app.component.ts*
   ```ts{3}
   async loadTasks() {
     this.tasks = await this.context.for(Tasks).find({
       where: task => this.hideCompleted ? task.completed.isEqualTo(false) : undefined,
       orderBy: task => task.completed
     });
   }
   ```

   ::: warning Note
   Because the `completed` field is of type `BoolColumn`, the argument of its `isEqualTo` method is **compile-time checked to be of the `boolean` type.**
   :::

3. Add a `checkbox` input element immediately before the unordered list element in `app.component.html`, bind it to the `hideCompleted` field, and add a `change` handler which calls `loadTasks` when the value of the checkbox is changed.

   *src/app/app.component.html*
   ```html
   <p>
      <input type="checkbox" [(ngModel)]="hideCompleted" (change)="loadTasks()">Hide completed
   </p>
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.

## Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate task title length

Task titles should be at least 3 characters long. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Tasks` entity class, modify the `StringColumn` constructor call for the `title` field to include an argument which implements the `ColumnOptions` interface. Implement the interface using an anonymous object and set the object's `validate` property to an arrow function containing the validity check.

   *src/app/tasks.ts*
   ```ts
   readonly title = new StringColumn({
      validate: () => {
         if (this.title.value.length < 3)
            this.title.validationError = 'is too short';
      }
   });
   ```

2. In the `app.component.html` template, add a `div` element immediately after the `div` element containing the new task title `input`. Set an `ngIf` directive to display the new `div` only if `newTask.title.validationError` is not `undefined` and place the `validationError` text as its contents.

   *src/app/app.component.html*
   ```html
   <div *ngIf="newTask.title.validationError">
      {{newTask.title.defs.caption}} {{newTask.title.validationError}}
   </div>
   ```

After the browser refreshes, try creating a new `task` with a title shorter than 3 characters - the "Title is too short" error message is displayed.

Attempting to modify titles of existing tasks to invalid values will also fail, but the error message is not displayed because we haven't added the template element to display it.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:4200/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:4200/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"t\"}"
```

An http error is returned and the validation error text is included in the response body,


## Server Functions
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

### Set all tasks as un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAll` async function to the `AppComponent` class, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/app/app.component.ts*
   ```ts
   async setAll(completed: boolean) {
      for await (const task of this.context.for(Tasks).iterate()) {
         task.completed.value = completed;
         await task.save();
      }
      this.loadTasks();
   }
   ```

   The `iterate` method is an alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects. The `iterate` method doesn't return an array (as the `find` method) and instead returns an `iteratable` object which supports iterations using the JavaScript `for await` statement.


2. Add the two buttons to the `app.component.html` template, immediately before the unordered list element. Both of the buttons' `click` events will call the `setAll` function with the relevant value of the `completed` argument.

   *src/app/app.component.html*
   ```html
   <button (click)="setAll(true)">Set all as completed</button> 
   <button (click)="setAll(false)">Set all as uncompleted</button>
   ```

Make sure the buttons are working as expected before moving on to the next step.
### Refactoring `setAll` to have it run on the server
With the current state of the `setAll` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

A simple way to prevent this is to expose an API endpoint for `setAll` requests, and run the same logic on the server instead of the client.

Refactor the `for await` loop from the `setAll` function of the `AppComponent` class into a new, `static`, `setAll` function which will run on the server.

*src/app/app.component.ts*
```ts{2,5-11}
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

::: danger Import ServerFunction
Don't forget to import `ServerFunction` from `@remult/core` for this code to work.
:::

The `@ServerFunction` decorator tells Remult to expose the function as an API endpoint (the `allowed` property will be discussed later on in this tutorial). 

The optional `context` argument of the static `setAll` function is omitted in the client-side calling code, and injected by Remult on the server-side with a server `Context` object. **Unlike the client implementation of the Remult `Context`, the server implementation interacts directly with the database.**

::: warning Note
With Remult server functions, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the "Set all..." buttons function exactly the same, but they will do the work much faster.

## Authentication and Authorization

Our todo app is nearly functionally completed, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism which enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field level authorization code should be placed in entity classes**.

User authentication remains outside the scope of Remult. In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

### Tasks CRUD operations require sign in
This rule is implemented within the `Tasks` entity class constructor, by modifying the `allowApiCRUD` property of the anonymous implementation of the argument sent to `super`, from a `true` value to an arrow function which accepts a Remult `Context` object and returns the result of the context's `isSignedIn` method.

*src/app/tasks.ts*
```ts{4}
constructor() {
   super({
      name: 'tasks',
      allowApiCRUD: context => context.isSignedIn()
   })
}
```

After the browser refreshes, the list of tasks disappeared and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL
```sh
curl -i http://localhost:4200/api/tasks
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCRUD` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@ServerFunction` decorator of the `setAll` method of `AppComponent`.

*src/app/app.component.ts*
```ts
@ServerFunction({ allowed: context => context.isSignedIn() })
```
:::
### User authentication
Let's add a sign in area to the todo app, with an `input` for typing in a `username` and a sign in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign in, the sign in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [@auth0/angular-jwt](https://github.com/auth0/angular2-jwt) for client-side JWT decoding and passing HTTP `Authorization` headers to the API server
* [express-jwt](https://github.com/auth0/express-jwt) to validate JWT on the API server

1. Open a terminal and run the following command to install the required packages:
   ```sh
   npm i jsonwebtoken @auth0/angular-jwt express-jwt
   ```

2. Import `jsonwebtoken` into a `jwt` variable in `app.component.ts`.

   *src/app/app.component.ts*
   ```ts
   import * as jwt from 'jsonwebtoken';
   ```

3. Add a `signIn` server function to the `AppComponent` class. The (very) simplistic `signIn` function will accept a `username` argument, define a dictionary of valid users, check whether the argument value exists in the dictionary and return a JWT string signed with a secret hash key. 
   
   The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.

   ```ts
   @ServerFunction({ allowed: true })
   static async signIn(username: string) {
      let validUsers = {
         ["Jane"]: { id: "1", name: "Jane", roles: [] },
         ["Steve"]: { id: "2", name: "Steve", roles: [] },
      };
      let user = validUsers[username];
      if (!user)
         throw "Invalid User";
      return jwt.sign(user, "my secret hash key");
   }
   ```

4. Exclude `jsonwebtoken` from browser builds by adding the following JSON to package.json.

   *package.json*
   ```json
   "browser": {
      "jsonwebtoken": false
   }
   ```

   ::: danger This step is not optional
   Angular CLI will fail to serve/build the app unless `jsonwebtoken` is excluded
   :::

5. Add the following code to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   static readonly AUTH_TOKEN_KEY = "authToken";

   setAuthToken(token: string) {
      this.context.setUser(<UserInfo>new JwtHelperService().decodeToken(token));
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
   }

   username: string;

   async signIn() {
      this.setAuthToken(await AppComponent.signIn(this.username));
      this.loadTasks();
   }

   signOut() {
      this.context.setUser(undefined);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
   }
   ```

   ::: warning Imports
   This code requires imports for `UserInfo` from `@remult/core` and `JwtHelperService` from `@auth0/angular-jwt`.
   :::

6. Add the following HTML after the `title` element of the `app.component.html` template.

   *src/app/app.component.html*
   ```html
   <ng-container *ngIf="!context.isSignedIn()">
      <input [(ngModel)]="username"> 
      <button (click)="signIn()">Sign in</button>
   </ng-container>

   <ng-container *ngIf="context.isSignedIn()">
      Hi {{context.user.name}}
      <button (click)="signOut()">Sign out</button>
   </ng-container>
   ```

7. Add `JwtModule` to the `imports` section of the `@NgModule` decorator of `AppModule`.

   *src/app/app.module.ts*
   ```ts
   JwtModule.forRoot({
      config:{
         tokenGetter: () => sessionStorage.getItem(AppComponent.AUTH_TOKEN_KEY)
      }
   })
   ```

8. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. Then, provide the `UserInfo` JWT payload (stored by `express-jwt` in `req.user`) to Remult.

   *src/server/index.ts*
   ```ts
   import * as express from 'express';
   import { initExpress } from '@remult/core/server';
   import '../app/app.module';
   import * as expressJwt from 'express-jwt';

   let app = express();
   app.use(expressJwt({ secret: "my secret key", credentialsRequired: false, algorithms: ['HS256'] }));
   initExpress(app);
   app.listen(3002);
   ```
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

#### Step 2, install and use jwt
```sh
npm i jsonwebtoken @types/jsonwebtoken
```

In the `server.ts` we'll use JWT as the token provider for the `initExpress` method:
```ts{9,23,24,25,26,27,28}
import * as express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
import * as forceHttps from 'express-force-https';
import * as jwt from 'jsonwebtoken';
import '../app.module';

config(); //loads the configuration from the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
});
let database = new SqlDatabase(new PostgresDataProvider(pool));
verifyStructureOfAllEntities(database); //This method can be run in the install phase on the server.

let app = express();
if (!process.env.DEV_MODE)
    app.use(forceHttps);
initExpress(app, database, {
    tokenProvider: {
        createToken: userInfo => jwt.sign(userInfo, process.env.TOKEN_SIGN_KEY),
        verifyToken: token => jwt.verify(token, process.env.TOKEN_SIGN_KEY)
    }
});
app.use(express.static('dist/angular-sample'));
app.use('/*', async (req, res) => {
    try {
        res.send(fs.readFileSync('dist/angular-sample/index.html').toString());
    } catch (err) {
        res.sendStatus(500);
    }
});
let port = process.env.PORT || 3002;
app.listen(port); 
```

#### Step 3, add the `JwtSessionService` to the `app.module.ts`
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
```ts{2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,23,24}
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
    this.loadTasks();
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
    <input [(ngModel)]="newtask.title.inputValue">
    <span style="color:red">{{newtask.title.validationError}}</span>
    <button (click)="addNewTasks()">Add New Task</button>
    <br>
    <input type="checkbox" [(ngModel)]="hideCompleted" (change)="loadTasks()">Hide Completed
    <ul>
        <li *ngFor="let task of tasks">
            <input [(ngModel)]="task.completed.inputValue" type="checkbox">
            <input [(ngModel)]="task.title.inputValue"
            [style.textDecoration]="task.completed.value?'line-through':''">
            <span style="color:red">{{task.title.validationError}}</span>
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
  


### Securing the API
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
                this.name.validationError = 'too short';
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

### Using Roles
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
                this.name.validationError = 'too short';
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

### Recording the completing user
```ts{11,12,13,14,15,16,17,20,21,22,23,24,25,26,27}
@EntityClass
export class Tasks extends IdEntity {
    name = new StringColumn({
        validate: () => {
            if (this.name.value.length < 2)
                this.name.validationError = 'too short';
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


## Deployment

### Https
The first stage of securing any application is making sure that the communication between the server and the browser will be encrypted using SSL and HTTPS.

In our app, we want to make sure that any request that comes in without encryption (using http) will be automatically redirected to use encryption (https).

To do that we'll install a package called:`express-force-https`
```sh
npm i express-force-https
```

And adjust the `server.ts` to call it. Since most dev environments do not have https - we'll only call it in production.
```ts{8,20,21}
import * as express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
import * as forceHttps from 'express-force-https';
import '../app.module';

config(); //loads the configuration from the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
});
let database = new SqlDatabase(new PostgresDataProvider(pool));
verifyStructureOfAllEntities(database); //This method can be run in the install phase on the server.

let app = express();
if (!process.env.DEV_MODE)
    app.use(forceHttps);
initExpress(app, database);
app.use(express.static('dist/angular-sample'));
app.use('/*', async (req, res) => {
    try {
        res.send(fs.readFileSync('dist/angular-sample/index.html').toString());
    } catch (err) {
        res.sendStatus(500);
    }
});
let port = process.env.PORT || 3002;
app.listen(port); 
```



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


### Production Tips
It's recommended to use compression on the server in production environments:
```sh
npm i compression
```

In `server.ts`
```ts{10,22}
import * as express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
import * as forceHttps from 'express-force-https';
import * as jwt from 'jsonwebtoken';
import * as compression from 'compression';
import '../app.module';

config(); //loads the configuration from the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
});
let database = new SqlDatabase(new PostgresDataProvider(pool));
verifyStructureOfAllEntities(database); //This method can be run in the install phase on the server.

let app = express();
app.use(compression());
if (!process.env.DEV_MODE)
    app.use(forceHttps); 
initExpress(app, database, { 
    tokenProvider: {
        createToken: userInfo => jwt.sign(userInfo, process.env.TOKEN_SIGN_KEY),
        verifyToken: token => jwt.verify(token, process.env.TOKEN_SIGN_KEY)
    }
});
app.use(express.static('dist/angular-sample'));
app.use('/*', async (req, res) => {
    try {
        res.send(fs.readFileSync('dist/angular-sample/index.html').toString());
    } catch (err) {
        res.sendStatus(500);
    }
});
let port = process.env.PORT || 3002;
app.listen(port); 
```

## todo
[V] finish release of remult after jwt changes introduced in v2.2.1

[V] don't forget to add .env to the .gitignore

[V] Reconsider the Context Injection to use angular http client instead of nothing is it does right now. maybe even consider creating an AppContext and do something with it~~

[V] extract from init express the usage of compression, secure etc... and make the JwtAuthentication recieve a authenticate provider interface that is simple and is implemented with the jwt. make JWTCookieAuthorizationHelper internal and only get sign and validate in the interface.


[] reconsider the find limit - currently it's set by default to 25 and that can cause problems.

[] reconsider separating the setup code - to something the user can extract from a github template - and only worry about the setup if they want to.

[] document the constructor parameters of column

[] consider code that decodes jwt in jwt-session-service

[] copy code does not work well

[] verifyStructureOfAllEntities better name (should include the word schema)

[] auto create the data folder and tasks.json 

[] use json-base for dev

[] explain Column

[] use pg for deployment

[] remove @remult/server when we can

[] consider more code reviews