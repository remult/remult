# Angular for non Web Developers
In this tutorial we'll review how to create a remult, angular, material CRUD database application, and deploy it to the cloud.

This tutorial uses the `@remult/angular` opinionated starter kit, that includes:
1. Angular
2. Angular Routing
3. [Angular Material](https://material.angular.io/)
4. Basic User Authentication and Authorization
5. Deployment Ready code, that can be easily deployed using Heroku
6. Uses a basic Json db for development, and Postgres SQL in Production.

For a less opinionated tutorial that is designed for developers who are already familiar with Angular, see [Todo App with Angular](/guide/tutorial-angular.html)

::: danger Please Note
This article uses the experimental `@remult/angular` library that is still work in progress.
:::

## Installation
Please review the steps in the [Installing a Dev Machine
](05-Installing-a-Dev-Machine.html)

And also please install angular, by running the following command:
```sh
npm install -g @angular/cli
```

### Creating a new project
The first thing we'll do is let angular create the project using it's CLI.

Open a command prompt in a folder that'll be the parent of your new project (in my case I use `c:\repos\`) and run the following command, replacing `my-project` with the name of the project you want to use:
```sh
ng new --style=scss --routing=true --skipTests=true my-project
```

### Install the Starter Kit
Next go into the folder of your new project
```sh
cd my-project
```

And run the following command to install the `remult` framework starter kit. 
```sh
ng add @remult/angular
```
This will add:
3. [Angular Material](https://material.angular.io/)
4. Basic User Authentication and Authorization
5. Deployment Ready code, that can be easily deployed using Heroku
6. Uses a basic Json db for development, and Postgres SQL in Production.


### open vs code in the `my-project` directory
In the command prompt type:
```
code .
```
## Running the development Environment
Now that we have our new project configured, we want to run it.

Open Visual Studio code in the folder of your project (`my-project` in our case).


### Understanding the different servers
When developing an angular application in a dev environment we'll need two servers,
1. Angular dev server - used by Angular for the front end development (the ui that'll run in the browser). This server will use port 4200
2. Node JS web server - is the Actual server, where all the data access will be and all the heavy lifting will be done. this server will use port 3000.

### Running the servers
We'll use visual studio tasks to run our common tasks. 

To run a visual studio task, we'll go to the menu `Terminal\Run Task...` and select the task we want to run.

Alternatively you can click <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open visual studio's code `command pallet`
and select `Tasks:Run Task`
![](/2019-09-23_14h40_29.png)

And then select the task called `dev`.

**Great, now we can start**
Once both tasks settle down you should see at the bottom of your screen the output of both tasks:
![](/2019-10-06_12h04_03.png)

Simply open a browser with the url `http://localhost:4200` and you'll see your application running

![](/the-first-application-stage.png)


### A little more information
* the task `npm:dev-node` builds the code that will run on the NodeJS server and runs it. 

  Whenever a code file changes, it'll automatically rebuild the project and restart it.

* The task `npm:dev-ng` runs the angular dev server, after it completes, you can open a browser using the `http://localhost:4200` url.

  Whenever a code file changes, it'll automatically refresh the browser to reflect that change.

  To read more about this see the [Architecture page](architecture)

## Hello Angular

Now that we have the application running, we can start using Angular to our advantage.

In this section, I'll cover the very basic aspects of Angular - but this is by no means a complete Angular course, please review the [Further learning](further-learning.html) page for more training resources.

If you are already familiar with angular principles, please proceed to the next chapter

### The Home Component

The first thing we see in the application, is the `HomeComponent` 

![](/home-component.png)

let's review it's code.

In the file explorer (in the left of your editor), under the `src\app` directory you will find the `home` directory that has all the files that are related to the `HomeComponent`

![](/home-component-file-structure.png)

The files are:


1. home.component.html - holds the html template for the component
2. home.component.scss - holds the css rules for the component
3. home.component.ts - holds the TypeScript business logic for the component.

#### Changing the html
Let's open the `home.component.html` file and make the following change:
```html{2}
<p>
   Hello world!
</p>
```

 while you do that, please look at your browser and see that it automatically refreshes whenever we change a file in the code. We have the Angular dev server to thank for that.




### Binding the html to data from the component

Let's add a field in our component and use it from the html.

In the `home.component.ts` add the `newTaskTitle` field:
```ts{11}
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
  newTaskTitle = 'New Task';
  ngOnInit() {
  }
}
```

Now we can use the `newTaskTitle` field in the `home.component.html` file
```html{2}
<p>
    Task: {{newTaskTitle}}
</p>
```

Within the curly brackets, we can write any typescript code and it'll work, for example if we'll write `{{ 1 + 1}}` it'll write 2 in the html.

### Getting input from the user
Let's add the following line to the `home.component.html` file:
```html{1}
<input [(ngModel)]="newTaskTitle" />
<p>
  Task: {{newTaskTitle}}
</p>
```
We've added the html `input` tag - and in it we've added the following code `[(ngModel)]="newTaskTitle"` which tells Angular to bind the data from the input, to the `newTaskTitle` field.
Whenever the user will type a value in the `input` html element - the page will recompute to reflect that change.

For example, type in 'create cool app' in the `input` and you'll see it refresh.

::: tip
 because we've installed the `angular2-switcher` we can now switch between the `home.component.ts` to the `home.component.html` file easily by pressing <kbd>alt</kbd> + <kbd>O</kbd>. See [angular2-switcher](https://marketplace.visualstudio.com/items?itemName=infinity1207.angular2-switcher) for more shortcuts.
:::

### using If logic in the Html Template *ngIf
Now, we want to make sure that we only greet someone with a name, meaning that if you don't type any value in the `input` we don't want to write the `Hello ` statement.
We'll do that using Angular's `*ngIf` tag

```html{2}
<input [(ngModel)]="newTaskTitle" />
<p *ngIf="newTaskTitle.length>0">
  Task: {{newTaskTitle}}
</p>
```

By placing the `*ngIf` tag in the `<p>` html element - we've got angular to only write the `<p>` section (and all it's content) into the html if the condition we specified is met.

### Data Structures

instead of just using fields, we can use a data structure that we define. In typescript, it's called an `interface`.
Let's add a file in the `src/app/home` folder, called `task.ts` and place the following code in it:

```ts
export interface Task {
    title: string;
    completed?: boolean;
}
```

1. We've created an `interface` with the name of `Task`
2. this interface will have two members:
    1. title of type string - the structure in typescript is member `title`, colon (:) and the member type `string`.
    2. completed? of type boolean, which is optional (the question mark indicates that this is an optional field)
3. By adding the `export` keyword before the `interface` we've indicated that we might use this interface elsewhere in the application.

Now let's use our new interface with it's two members.

In the `home.component.ts` file
```ts{2,12-15}
import { Component, OnInit } from '@angular/core';
import { Task } from './task';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
  newTask: Task = {
    title: 'New Task',
    completed: false
  };
  ngOnInit() {
  }
}
```

In the `home.component.html` file:
```html
What is your name?
<input [(ngModel)]="newTask.title" />
<p *ngIf="newTask.title.length>0">
  Task: {{newTask.title}}
</p>
```
we've replace all references to `newTaskTitle` to the `title` field of the `newTask` instance => `newTask.title`

### Arrays
Arrays are easy to define in typescript and are very powerful. For those of you coming from C# it's a full blown powerful list.

Let's add an array of tasks, to the 'home.component.ts' file
```ts{8}
export class HomeComponent implements OnInit {

  constructor() { }
  newTask: Task = {
    title: 'New Task',
    completed: false
  };
  tasks: Task[] = [];
  ngOnInit() {
  }
}
```
In this line we've defined a new `member` called `tasks` - it's of Type `Task[]` (Task Array) = and we have initialized it with an empty Array (`[]`);

We can add Items to the Array

```ts{9-10}
export class HomeComponent implements OnInit {
  constructor() { }
  newTask: Task = {
    title: 'New Task',
    completed: false
  };
  tasks: Task[] = [];
  ngOnInit() {
    this.tasks.push({ title: 'Task a' })
    this.tasks.push({ title: 'Task b' });
  }
}
```
We can also initialize the Array with these items in one line:

```ts{7}
export class HomeComponent implements OnInit {
  constructor() { }
  newTask: Task = {
    title: 'New Task',
    completed: false
  };
  tasks: Task[] = [{ title: 'Task a' }, { title: 'Task b' }];
  ngOnInit() {
  }
}
```

### Using Arrays in the Html Template using *ngFor
Let's display a list of Tasks in our `home.component.html`

```html{5-9}
<input [(ngModel)]="newTask.title" />
<p *ngIf="newTask.title.length>0">
  Task: {{newTask.title}}
</p>
<ul>
  <li *ngFor="let task of tasks">
     {{task.title}}
  </li>
</ul>
```
In line 5 we've added an unordered list using the `<ul>` html tag.
By placing the `*ngFor` tag in the `li` html tag, we ask Angular to repeat the `li` tag for every item in the array (Task in the tasks array)

### Adding a button with a Click event
Now, I want the user to be able to add a task to the list.

First, in the `home.component.ts` let's add the `createNewTask` method
```ts {10-13}
export class HomeComponent implements OnInit {
  constructor() { }
  newTask: Task = {
    title: 'New Task',
    completed: false
  };
  tasks: Task[] = [{ title: 'Task a' }, { title: 'Task b' }];
  ngOnInit() {
  }
  createNewTask() {
    this.tasks.push(this.newTask);
    this.newTask = { title: "New Task" };
  }
}
```

And now let's call it from the `home.component.html` template
```html{2}
<input [(ngModel)]="newTask.title" />
<button (click)="createNewTask()">Create new task</button>
<p *ngIf="newTask.title.length>0">
  Task: {{newTask.title}}
</p>
<ul>
  <li *ngFor="let task of tasks">
     {{task.title}}
  </li>
</ul>
```

We've added a button, and in it's `(click)` event we call the `createNewTask` method we've defined in the `home.component.ts`

### Delete tasks
Let's add a `Delete` button next to each task on the list, which will delete that task and remove it from the list.

1. Add the following `deleteTask` method to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   deleteTask(task: Task) {
     this.tasks = this.tasks.filter(t => t != task);
   }
   ```

2. Add the `Delete` button to the task list item template element in `app.component.html`.

   *src/app/app.component.html*
   ```html{4}
   <ul>
     <li *ngFor="let task of tasks">
       {{task.title}}
       <button (click)="deleteTask(task)">Delete</button>
     </li>
   </ul>
   ```

After the browser refreshes, a `Delete` button appears next to each task in the list. Delete a `task` by clicking the button.

### Making the task titles editable
To make the titles of the tasks in the list editable, let's add an html `input` for the titles

Replace the task `title` template expression in `app.component.html` with the highlighted lines:

*src/app/app.component.html*
```html{3}
<ul>
  <li *ngFor="let task of tasks">
    <input [(ngModel)]="task.title">
    <button (click)="deleteTask(task)">Delete</button>
  </li>
</ul>
```

### Mark tasks as completed
Let's add a new feature - marking tasks in the todo list as completed using a `checkbox`. Titles of tasks marked as completed should have a `line-through` text decoration.

Add a an html `input` of type `checkbox` to the task list item element in `app.component.html`, and bind its `ngModel` to the task's `completed` field. 

Set the `text-decoration` style attribute expression of the task `title` input element to evaluate to `line-through` when the value of `completed` is `true`
*src/app/app.component.html*
```html{2-4}
<li *ngFor="let task of tasks">
  <input [(ngModel)]="task.completed" type="checkbox">
  <input [(ngModel)]="task.title" 
   [style.textDecoration]="task.completed?'line-through':''">
  <button (click)="deleteTask(task)">Delete</button>
</li>
```

After the browser refreshes, a checkbox appears next to each task in the list. Mark a few tasks as completed using the checkboxes.

## Storing data on the Server
So far, everything that we've done is locally in the web browser window. As soon as we refresh, all the tasks we've create disappear. 

Let's change this code, to store it's data on the server.



## Adding an Angular Component & Route
In this step we want to create a new Angular `Component` for the `Products` table we want to add and update.

In visual studio code you can open a terminal window to activate commands from the command line.
To open the terminal window click on the `Terminal\new Terminal` menu.

### Adding the Component
In the terminal window run the following command to create the `Products` component.
```sh
ng generate component products
```

After running this command we'll see that a folder called `products` was created under the `src/app` folder and in it there are three files:
1. products.component.html - the html template of the component
2. products.component.scss - the style sheet file for the component
3. products.component.ts - the typescript code file

### Adding a Route for the component
Next we would like to be able to navigate to the component, so that the user will be able to type the url `https://www.oursite.com/products` they'll reach the products component.

to do that we'll add a route for it in the `app-routing.module.ts`.
> pro tip: you can quickly open a file by clicking <kbd>Control</kbd> + <kbd>P</kbd> and typing the name of the file you want to open.

```ts{11,16}
import { RemultModule } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';
import { AdminGuard } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { terms } from './terms';
import { ProductsComponent } from './products/products.component';

const defaultRoute = terms.home;
const routes: Routes = [
  { path: defaultRoute, component: HomeComponent },
  { path: 'Products', component: ProductsComponent },
  { path: terms.userAccounts, component: UsersComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '/'+defaultRoute, pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    RemultModule,
  JwtModule.forRoot({
    config: { tokenGetter: () => AuthService.fromStorage() }
  })],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```
1. In the routes array we've added a route with the path `Products` which will call the `ProductsComponent`
2. By default, it'll also be added to the sidebar automatically, so now the users can select it from the menu. 
3. When we'll click on the `Products` menu entry, it'll navigate to our component and we should see the message "products works!"

::: tip Pro Tip
You don't have to start by adding the `import` statement on line 11, instead when you'll start typing the `ProductsComponent`in line 16, vs code will automatically suggest to add the import (most times :))
:::

::: tip Pro Tip 2
If you don't have the `import` statement you need, just hover over the class you need (`Products` in this case), and visual studio will tell you that it `cannot find name 'products'` and will suggest a quick fix that will be to add the import statement.
You can also use <kbd>control</kbd> + <kbd>.</kbd> (dot) and it'll suggest to add the import
:::

## Adding an Entity
At this stage we would like to define the product Entity, where we will store our product information.
Let's add a new file under the `Products` folder, called `product.ts`


<<< @/docs-code/products/product.ts

Let's review:
1. We've added a `Product` class that extends the `IdEntity` class from `remult`. This will create an `Entity` that will have an `id` field that is unique, and anything else we would like to add to it.
2. On lines 3-6 we've called the `Entity` decorator and configured:
   1.  Line 8 - the `key` for our `API` 
   2.  Line 9 - `allowApiCrud` determined that CRUD operations are allowed in the `API` (**C**reate **R**ead **U**pdate **D**elete)
3. On lines 8-9 we've defined a `name` field (the product name)
   

>The `allowApiCrud` properties are set by default to false, to secure the data of your application, you may want to restrict access to this data and we want to make sure that data will not be exposed by default. Later we'll review how to control access to data.

### Using the Entity in a Component
Now let's add a grid on the `ProductsComponent` that displays the `Product` Entity.

We are using the `data-grid` and `GridSettings` objects from `@remult/angular`. The `data-grid` is a quick and easy to use data grid that is intended to help you create admin screens with ease. For more info on it see [Data Grid](datagrid)

in `products.component.ts`

<<< @/docs-code/products/products.component.ts{12-15} 

let's review:
1. We've added the required imports (those are added automatically when typing the names later on and allowing vscode to add them. See "adding the import statements" note below)
2. We've added a parameter to the constructor called `remult` of type `Remult` from `remult`. This object will help us get data from the server and more. by tagging it as `private` we make it available throughout the class, by using `this.remult`
3. We've added the definition of `products` in this component. We've asked the remult to provide us with `gridSettings` for the `Entity` Product - and we've configured it to allow update insert and delete.



:::tip adding the import statements
 When you'll add the `remult` parameter to the constructor, you'll also require the `import` statement for the `Remult` class.

 If you don't already have that import statement, Visual Studio Code will highlight the parameter type in red and display a "light bulb" you can click to automatically add it:



 It'll then automatically add the `import { Remult } from 'remult';` statement to the top of the document.

 The same can be done for any missing `import` statement 
:::

### Placing the data-grid in the html
and in the `products.component.html`

<<< @/docs-code/products/products.component.html

let's review:
1. We've replaced the `html` with a `data-grid` tag that will display the grid settings provided in the `products` member of the `products.component.ts` file.


### The result on the server
Now if we'll look at the bottom of our screen, at the Terminal output for the task `node-serve`, we'll see that the server restarted and a new api is now available:
```{7}
start verify structure
/api/Users_methods/create
/api/Users_methods/updatePassword
/api/resetPassword
/api/signIn
/api/Users
/api/Products
```
Let's review:
1. On line 7 it added an api endpoint for our `Product` `Entity`
:::tip
Initially in this tutorial we're using a json file based database - later when we'll use an sql database, the table will be automatically created using a script similar to:
```sql
create table Products (
  id varchar default '' not null  primary key,
  name varchar default '' not null
)
```
:::


When we'll review the products page, we'll be able to see an empty grid with a field called `id` and a field called `name`, we can add new rows by clicking on the `+` sign at the bottom, and saving them when we edit them.

Let's add a few products:
1. Beer
2. Wine
3. Bread


:::tip
At this stage we are using a json file based database, you can see it's data by opening the `db` folder in your project, and review the `product.ts` file to see the values.
See how when you update the data, the file automatically gets updated.
:::

### Viewing the Rest Api
We can also navigate through the browser directly to the api address `http://localhost:4200/api/products` and see the Json result we'll get when calling the api.

```json
[
  {
    "id": "b2069675-586a-4a9d-b85b-c519c7e09162",
    "name": "Wine"
  },
  {
    "id": "f2962832-e533-4ef9-93cf-1af446673d60",
    "name": "Beer"
  },
  {
    "id": "7668da48-e773-459d-90a5-44cfb0844b4e",
    "name": "Bread"
  }
]
```

### Adding More Fields
let's add a price, and availability dates to the `Product` entity

In the `product.ts` file

<<< @/docs-code/products-batch-operations/products.ts{9-14}


And when we'll look at the browser, we'll see that there are 3 more columns to the grid

:::tip
Later, when we'll use an sql database, the columns will also automatically be created in the database using a script similar to:
```sql
alter table Products add column price int default 0 not null
alter table Products add column availableFrom date
alter table Products add column availableTo date
```
:::


## Displaying the Products Entity using Custom Html

Next we would like to create a list of products that our site visitors can see on our home page.

First, let's clear everything we've played with in our `home.component.html` and our `home.component.ts` 
Replace the `home.component.html` content with the default:
```html
 <p>
  home works!
 </p>
```

Replace the `home.component.ts` content with the default:
```ts
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor() { }
  ngOnInit() {
  }
}
```


Let's start with designing our `home.component.html` - we'll use Angular Material components for this design - specifically the  [Mat-Card](/https://material.angular.io/components/card/overview)

Let's start with the basic card:
```html
<h1>Available Products</h1>
<mat-card>
  <mat-card-title>
    My Product
  </mat-card-title>
  <mat-card-subtitle>
    this is my subtitle
  </mat-card-subtitle>
</mat-card>
```

Next we would like to use the actual data from the `product` entity.
In the `home.component.ts` file, the first step would be to get the `remult` object in. As used before, the `remult` object helps us with comunicating with the server and figuring out our remult
```ts{2}
export class HomeComponent implements OnInit {
  constructor(private remult:Remult) { }
  ngOnInit() {
  }
}
```
:::tip NOTE
 If the `Remult` class is highlighted in red, add it to the `import` statement using the "light bulb" icon in visual studio
:::
Next let's define a list of products:
```ts{3}
export class HomeComponent implements OnInit {
  constructor(private remult:Remult) { }
  products : Product[] = [];
  ngOnInit() {
  }
}
```

:::tip NOTE
 If the `Product` class is highlighted in red, add it to the `import` statement using the "light bulb" icon in visual studio
:::

We've defined a member called `products` of type `Product[]` (an Array of products) and have set it's initial value to an empty array (` = []`)

Now let's populate the array with products from our db:
```ts{4-6}
export class HomeComponent implements OnInit {
  constructor(private remult: Remult) { }
  products: Product[] = [];
  async ngOnInit() {
    this.products = await this.remult.repo(Product).find();
  }
}
```

Just three lines, but a lot to explain.

When developing web applications, all the calls to the server (and many many other things) are performed asynchronously. That means that while we wait for the call to the server to complete, the code can do other things (specifically not leave the user interface hung).

The fact that the call to the `find` method is asynchronous can be  inferred from it's return type - in this case `Promise<Product[]>`. Any method that returns a `Promise` will run asynchronously. In this case it return a `Promise` of type `Product[]`.

We want to wait for the result of this `Promise`. To do that we'll have to decorate the method we are running with the `async` keyword (as we've done on line 5) and use the `await` keyword when we call the method.

Now let's adjust the `home.component.html` to use these products, using the `*ngFor` directive
```html{2,4,7}
<h1>Available Products</h1>
<mat-card *ngFor="let p of products">
  <mat-card-title>
    {{p.name}}
  </mat-card-title>
  <mat-card-subtitle>
    {{p.availableFrom | date}} - {{p.availableTo | date}}
  </mat-card-subtitle>
</mat-card>
```
* We're using the `|date` angular pipe to display the dates nicely.

Now let's format the cards to display multiple cards in a row. We'll add a `css` class to the `mat-card` tag
```html{2}
<h1>Available Products</h1>
<mat-card *ngFor="let p of products" class="product-card">
  <mat-card-title>
    {{p.name}}
  </mat-card-title>
  <mat-card-subtitle>
    {{p.availableFrom | date}} - {{p.availableTo | date}}
  </mat-card-subtitle>
</mat-card>
```

and in the `home.component.scss` file we'll define that class:
```scss
.product-card{
    width:260px;
    display:inline-block;
    margin:10px;
}
```

### Sorting
Now let's sort the cards by name. In the `home.component.ts` file, let's start by sending an object to the `find` method:
```ts{2-3}
  async ngOnInit() {
    this.products = await this.remult.repo(Product).find({
    });
  }
```

Next let's add the `orderBy` property:
```ts{3}
  async ngOnInit() {
    this.products = await this.remult.repo(Product).find({
      orderBy: p => p.name
    });
  }
```

The `orderBy` property is set to a method that receives the `Product` entity and returns one of several variations:
1. The column we wanted to sort on (as we've done in this case)
2. An array of columns we want to sort on - for example: `orderBy: p => [p.name,p.availableFrom]`
3. An Array of `SortSegments` that can be used to sort descending - for example: `orderBy: p => [{ column: p.name, descending: true }, p.availableFrom]`

In our case we'll stick to simply sorting by the Product Name.

### Filtering the Data
Since we only want to show products that are available, let's filter the products to indicate that:
```ts{4-5}
  async ngOnInit() {
    this.products = await this.remult.repo(Product).find({
      orderBy: p => p.name
      , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
          p.availableTo.isGreaterOrEqualTo(new Date()))
    });
  }
```

We've used the `where` property which receives a function that gets the `Product` entity as a parameter and returns a filter.

we've then used the column's filter method, these start with the `is` word and allow filtering (`isEqualTo`, `isGreaterOrEqualTo` etc...)

The result should look like this:

![](/2019-10-07_09h32_19.png)

## Batch Operations

The next requirement from our users is to be able to update the price of all products by a fixed amount in a simple operation.

We'll add an input and a button to the html and bind them to the `priceInput` field and `updatePrice` method that we'll add to the code.
In the 'products.component.html` file
```html
<input [(ngModel)]="priceInput">
<button (click)="updatePrice()">Update Price</button>
<data-grid [settings]="products"></data-grid>
```
In the 'products.component.ts` file

<<< @/docs-code/products-batch-operations/products.component.step1.ts{17-19}

### Updating the data
In the `products.component.ts`:

<<< @/docs-code/products-batch-operations/products.component.step2.ts{20-24}

* Note that we convert the `priceInput` from string to number, since all inputs return strings in angular.
* We use `await p.save()` to save the products one by one. (to do this, we have to add the word `async` before the `updatePrice` method as we've done in the previous step)
* we use `this.products.reloadData()` method to refresh the data displayed on the grid.

## Moving Logic to the Backend

In the previous article we've create a process that runs for each product and updates it. 
As we've written this process, it runs in the browser, requesting the Backend for a list of products, and then for every product sends another request to the Backend to perform the update.
Although this is valid when you have 10-20 products, if you have a 1000 products this can become slow, as each `save` call will take 0.1 seconds - times 1000 it's more than a minute.

An easy way to improve the performance, is to make a single call to the Backend and do all the business logic there.

Let's refactor the code to do that:

<<< @/docs-code/products-batch-operations/products.component.ts{20-33} 

* We've created a new static method called `updatePriceOnBackend` and moved the code to it
* * note that the `remult` parameter is marked as optional - that parameter will automatically be injected with the Backend remult once this method will run on the Backend.
* * note that since this is a `static` method, we can't use the `this` keyword so instead of writing `this.remult.repo(Product)` we write `remult.repo(Product) ` and we receive the remult as a parameter.
* * note that we also that the parameter `priceToUpdate` is typed, which means that we achieved type check across backend calls.
* We've tagged it with the `@BackendMethod` decorator to indicate that it runs on the Backend and we've moved the code to it.
* * In the parameter sent to the `@BackendMethod` decorator, we've set the `allowed` property to `true` indicating that anyone can run this function. Later we'll restrict it to users with specific roles.

If we'll review the output of the `node-serve` window, we'll see that a new API entry was added to the list:
```sh{4}
/api/Users_methods/create
/api/Users_methods/updatePassword
/api/resetPassword
/api/updatePriceOnBackend
/api/signIn
/api/Products
/api/Users
```

## Users and Security

The next thing on our feature list is managing users and security for the application.

We want users to be able to register and sign in to the application, and we want to have a role based system where:
1. Only admin users can update Products
2. Non signed in users can only view the products and register if they want.

We already have a built in security implementation that can do this, let's review how we use it and how it works.

### Creating the first user
We need to create our first user, to do that simply click on the `Register` menu entry, enter your info and click `Register`

![](/2019-10-08_11h09_40.png)

Now that you are signed in you can see your name at the top right toolbar, and you can click it to signout.

![](/2019-10-08_11h16_54.png)

After you sign out, you can click the `sign in` button at the top right and enter your name and password to sign in again.

### User Management
The first user that signs in is by default the application's `Admin` and has access to the `User Accounts` menu entry where users can be managed.

![](/2019-10-08_11h20_28.png)

Here you can manage the users and even reset their password.

### Securing the Products
Now that we understand how users can be managed, let's start securing the application by restricting access to the `Products`. 

In the `product.ts` 

<<< @/docs-code/products-batch-operations/products.secure.ts{5-6} 

We've changed the `allowApiCrud` property to only allow it for users that has the role `Roles.admin` (later we'll define new roles)
We've kept the `allowApiRead` to true, since even non signed in users can view products in the `home.component.ts`

This step has secured the `API` which means that even someone who is accessing our server directly, without the application can't update the categories if they are not authorized to do so.

Next we'll secure the `updatePriceOnBackend` server function we've used in the `products.component.ts`
```ts{1}
  @BackendMethod({allowed:Roles.admin})
  static async updatePriceOnBackend(priceToUpdate: number, remult?: Remult) {
```
We've set the `allowed` property to the `Roles.admin` role.

Next let's restrict access to the `products.component.ts` for the users themselves

In the `app-routing.module.ts`
```ts{3}
const routes: Routes = [
//other routes
    { path: 'Products', component: ProductsComponent, canActivate: [AdminGuard]  },
//other routes
];
```

We've added the `, canActivate: [AdminGuard]` definition to the `Products` path. This means that a user that does not have the `admin` role, will not be able to access the products entry in the menu.
||| tip
Create another user, without admin privileges and see  how that works.
|||
Now that you know about the `canActivate` you can see that several of the prepared routes are using similar guards:
1. AdminGuard - only users that have the `Admin` role.
2. NotSignedInGuard - only users that are not Signed in.
3. SignedInGuard - only users that are signed in.

## Deployment

This application is a standard node js application, that uses postgres as a database and can be deployed to any web server or cloud service that has node js and postgres.

In this tutorial we'll use heroku as they provide a great free plan and a very easy deployment experience.

:::tip NOTE
Before we start working on deployment, make sure that all the changes are committed to git, you can do that from visual studio code or by running the following command:
```sh
git add .
git commit -m "before deployment"
```
:::

### Step 1 Create an Heroku User and install their tools

Goto, [heroku's signup page](https://signup.heroku.com/) signup and create a user.

The heroku free plan provides for 550 free web server hours (they call it dyno) per month. You can increase that to 1000 hours by just adding your credit card info (no cost)

Next, download and install the [heroku command line tool](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

After that, goto the command line and run 
```sh
heroku login
```

And enter your credentials.
::: tip
If the command line can't find the `heroku` command, please close and reopen the command line window.
:::

### Step 2 Create the Heroku Application

In the Command line, in the project folder, we can use the `apps:create` command to create our project.
1. We can send it the region we want to use (by default it's USA, for europe and middleeast we recommend europe: `--region eu`)
2. Specify the name of the project, (`my-project` in our case) - that name will be used as the prefix for your application's url (`https://my-project.herokuapp.com` on our case). 
The name you want may be taken - so keep trying names until you reach a name that is free, or run the command without a name, and `heroku` will generate a name for you.

Here's the command with the specific name `my-project` in the `eu` region
```sh
heroku apps:create --region eu  my-project
```

Here's the result we got, when we allowed heroku to determine the name :)
```sh
Creating app... done, ⬢ desolate-fjord-53965, region is eu
https://desolate-fjord-53965.herokuapp.com/ | https://git.heroku.com/desolate-fjord-53965.git
```
1. The first part of the result is our website url - once we'll install the app, we can navigate there.
2. The second part of the result is the url for the git repository.

### Step 3 Provision the database on Heroku
run:
```sh
heroku addons:create heroku-postgresql:hobby-dev
```
### Step 4 Set the Authentication token sign key
The **Authentication token sign key**, is used to authenticate the user that uses the application. It's a secret key, that only the server should know and is used to decrypt information about the user, assuring that it is indeed the correct user.

It's important to set this value to some random crazy value that no one will have. A hacker with this key, will be able to impersonate anyone on your web site.

To read more about it, see [jwt](https://jwt.io/).

To Generate a unique string, goto [uuidgenerator](https://www.uuidgenerator.net/)

This key is required, so set it using:
```sh
heroku config:set TOKEN_SIGN_KEY=woEczJuvjuOWmIakjdvH
```

### Step 5 Deploy the application using git
```sh
git push heroku master -f
```

* This will take a few minutes, and will report the process of deploying the app to heroku
* You'll need to repeat this command whenever you want to update the code of your application.



### And We're done
Just run:
```sh
heroku apps:open
```
 It'll open browser with your application. You'll see the url provided to you in step 2 of this page  (`https://desolate-fjord-53965.herokuapp.com/` in our case).

Don't forget to sign in and declare yourself the admin :)

### Doing it all with a user interface
Heroku has a web user interface to setup your app, define the db and set the config vars, you may find it easier to use.

