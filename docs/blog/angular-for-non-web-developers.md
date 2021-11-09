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
cd my-project
ng add @remult/angular
```
1. Create an angular project.
2. change dir to the newly created project
3. install `remult` framework starter kit.
   
   This will add:

   1. [Angular Material](https://material.angular.io/)
   2. Basic User Authentication and Authorization
   3. Deployment Ready code, that can be easily deployed using Heroku
   4. Uses a basic Json db for development, and Postgres SQL in Production.


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
<input [(ngModel)]="newTask.title" />
<p *ngIf="newTask.title.length>0">
  Task: {{newTask.title}}
</p>
```
we've replace all references to `newTaskTitle` to the `title` field of the `newTask` instance => `newTask.title`

### Arrays
Arrays are easy to define in typescript and are very powerful. For those of you coming from C# it's a full blown powerful list.

Let's add an array of tasks, to the 'home.component.ts' file
```ts{7}
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

1. Add the following `deleteTask` method to the `HomeComponent` class.

   *src/app/home/home.component.ts*
   ```ts
   deleteTask(task: Task) {
     this.tasks = this.tasks.filter(t => t != task);
   }
   ```

2. Add the `Delete` button to the task list item template element in `home.component.html`.

   *src/app/home/home.component.html*
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

Replace the task `title` template expression in `home.component.html` with the highlighted lines:

*src/app/home/home.component.html*
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

Add a an html `input` of type `checkbox` to the task list item element in `home.component.html`, and bind its `ngModel` to the task's `completed` field. 

Set the `text-decoration` style attribute expression of the task `title` input element to evaluate to `line-through` when the value of `completed` is `true`
*src/app/home/home.component.html*
```html{2-4}
<li *ngFor="let task of tasks">
  <input [(ngModel)]="task.completed" type="checkbox">
  <input [(ngModel)]="task.title" 
   [style.textDecoration]="task.completed?'line-through':''">
  <button (click)="deleteTask(task)">Delete</button>
</li>
```

After the browser refreshes, a checkbox appears next to each task in the list. Mark a few tasks as completed using the checkboxes.

### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

Here are the code files we've modified to implement these features.

*src/app/task.ts*
```ts
export interface Task {
    title: string;
    completed?: boolean;
}
```

*src/app/home/home.component.ts*
```ts
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
  tasks: Task[] = [{ title: 'Task a' }, { title: 'Task b' }];
  ngOnInit() {
  }
  createNewTask() {
    this.tasks.push(this.newTask);
    this.newTask = { title: "New Task" };
  }
  deleteTask(task: Task) {
    this.tasks = this.tasks.filter(t => t != task);
  }
}

```

*src/app/home/home.component.html*
```html
<input [(ngModel)]="newTask.title" />
<button (click)="createNewTask()">Create new task</button>
<p *ngIf="newTask.title.length>0">
  Task: {{newTask.title}}
</p>
<ul>
  <li *ngFor="let task of tasks">
    <input [(ngModel)]="task.completed" type="checkbox">
    <input [(ngModel)]="task.title" 
     [style.textDecoration]="task.completed?'line-through':''">
    <button (click)="deleteTask(task)">Delete</button>
  </li>
</ul>
```

## Storing data on the Server
So far, everything that we've done is locally in the web browser window. As soon as we refresh, all the tasks we've create disappear. 

Let's change this code, to store it's data on the server.

### Turn the Task interface to an Entity
1. replace the code in the `Task.ts` file with the following code
   ```ts
   import { Field, Entity, IdEntity } from "remult";
   @Entity("tasks", {
       allowApiCrud: true
   })
   export class Task extends IdEntity {
       @Field()
       title: string = '';
       @Field()
       completed: boolean = false;
   }
   ```
   The `@Entity` decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and database collection/table), and an argument which implements the `EntityOptions` interface. We use an object literal to instantiate it, setting the `allowApiCrud` property to `true`. <!-- consider linking to reference -->

   `IdEntity` is a base class for entity classes, which defines a unique string identifier field named    `id`. <!-- consider linking to reference -->
   
   The `@Field` decorator tells Remult the `title` and `completed` properties are an entity data field. This decorator is also used to define field related properties and operations, discussed in the next sections of this tutorial.
2. Add the highlighted code lines to the `HomeComponent` class file:
   ```ts{2,11-14,19}
   import { Component, OnInit } from '@angular/core';
   import { Remult } from 'remult';
   import { Task } from './task';
   
   @Component({
     selector: 'app-home',
     templateUrl: './home.component.html',
     styleUrls: ['./home.component.scss']
   })
   export class HomeComponent implements OnInit {
     constructor(public remult: Remult) { }
     tasksRepo = this.remult.repo(Task);
     newTask = this.tasksRepo.create();
     tasks: Task[] = [];
     ngOnInit() {
     }
     createNewTask() {
       this.tasks.push(this.newTask);
       this.newTask = this.tasksRepo.create();
     }
     deleteTask(task: Task) {
       this.tasks = this.tasks.filter(t => t != task);
     }
   }
   ```
   The `remult` field we've add to the `HomeComponent` class (using a constructor argument), will be instantiated by Angular's dependency injection. We've declared it as a `public` field so we can use it in the HTML template later on.

   We set the `tasksRepo` field with a repository for the `Task` class.

   We replace the code to create a new task, to use `tasksRepo.create` method that creates a new `Task` class instance both in the `newTask` field and in the `createNewTask` method.

### Create new tasks
Change the `createNewTask` to save the new task to the server using the `save`. 
```ts{1,2}
async createNewTask() {
  await this.newTask.save();
  this.tasks.push(this.newTask);
  this.newTask = this.tasksRepo.create();
}
```
Note that we've added `async` before the `createNewTask` and `await` before the call to `save` because we want the code to "wait" until the `save` is completed, continuing to the next rows.

You'll use `async` and `await` whenever we run some long operation and need to wait for the server.

#### Run and create tasks
Using the browser, create a few new tasks. Then, navigate to the `tasks` API route at <http://localhost:4200/api/tasks> to see the tasks have been successfully stored on the server.

::: warning Wait, where is the backend database?
By default, `remult` stores entity data in a backend JSON database. Notice that a `db` folder has been created under the workspace folder, with a `tasks.json` file that contains the created tasks.
:::

### Display the list of tasks
Add and amend the highlighted code lines to the `HomeComponent` class file:
```ts{6-8,10,14}
export class HomeComponent implements OnInit {
  constructor(public remult: Remult) { }
  tasksRepo = this.remult.repo(Task);
  newTask = this.tasksRepo.create();
  tasks: Task[] = [];
  async loadTasks() {
    this.tasks = await this.tasksRepo.find();
  }
  ngOnInit() {
    this.loadTasks();
  }
  async createNewTask() {
    await this.newTask.save();
    this.loadTasks();
    this.newTask = this.tasksRepo.create();
  }
  deleteTask(task: Task) {
    this.tasks = this.tasks.filter(t => t != task);
  }
}
```
1. We've added the `loadTasks` method that uses the `find` method to load the tasks from the server and return then to the `tasks` array.
2. The `ngOnInit` hook method loads an array of tasks when the component is loaded.
3. To refresh the list of tasks after a new task is created, we call the `loadTasks` method in the `createNewTask` method of the `HomeComponent` class.

### Delete tasks
Replace the `deleteTask` method in `HomeComponent` class file:
```ts
async deleteTask(task: Task) {
  await task.delete();
  this.loadTasks();
}
```
Calling the `delete` method of the `Task` deletes the task on the server.

### Saving changes to tasks
 We'll add a `Save` button to save the changes to the backend database. We'll use the `wasChanged` method of the entity class to disable the `Save` button while there are no changes to save.
 ```html{5}
<li *ngFor="let task of tasks">
 <input [(ngModel)]="task.completed" type="checkbox">
 <input [(ngModel)]="task.title" 
  [style.textDecoration]="task.completed?'line-through':''">
  <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
 <button (click)="deleteTask(task)">Delete</button>
</li>

 ```

## Server side Sorting and Filtering 
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `loadTasks` method of the `HomeComponent` class, add an object literal argument to the `find` method call and set its `orderBy` property to an arrow function which accepts a `task` argument and returns its `completed` field.

*src/app/home/home.component.ts*
```ts{2-4}
async loadTasks() {
  this.tasks = await this.tasksRepo.find({
    orderBy: { completed: "asc" }
  });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::

### Hide completed tasks
Let's hide all completed tasks, using server side filtering.

1. In the `loadTasks` method of the `HomeComponent` class, set the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter.

   *src/app/home/home.component.ts*
   ```ts{3}
   async loadTasks() {
     this.tasks = await this.tasksRepo.find({
       where: { completed: false },
       orderBy: { completed: "asc" }
     });
   }
   ```

   ::: warning Note
   Because the `completed` field is of type `boolean`, the argument of its `isEqualTo` method is **compile-time checked to be of the `boolean` type.**
   :::

### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `HomeComponent` class.

   *src/app/home/home.component.ts*
   ```ts
   hideCompleted = false;
   ```

2. In the `loadTasks` method of the `HomeComponent` class, change the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter if the `hideCompleted` field is `true`.

   *src/app/home/home.component.ts*
   ```ts{3}
   async loadTasks() {
     this.tasks = await this.tasksRepo.find({
       where: this.hideCompleted ? { completed: false } : {},
       orderBy: { completed: "asc" }
     });
   }
   ```


3. Add a `checkbox` input element immediately before the unordered list element in `home.component.html`, bind it to the `hideCompleted` field, and add a `change` handler which calls `loadTasks` when the value of the checkbox is changed.

   *src/app/home/home.component.html*
   ```html
   <p>
      <input type="checkbox" id="hideCompleted" [(ngModel)]="hideCompleted" (change)="loadTasks()">
      <label for="hideCompleted">Hide completed</label>
   </p>
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.

## Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate task title length

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Field` decorator for the `title` field to include an argument which implements the `ColumnOptions` interface. Implement the interface using an anonymous object and set the object's `validate` property to `Validators.required`.

   *src/app/home/task.ts*
   ```ts{1-3}
    @Field({
        validate: Validators.required
    })
    title: string = '';
   ```

2. In the `home.component.html` template, add a `div` element immediately after the `div` element containing the new task title `input`. Set an `ngIf` directive to display the new `div` only if `newTask.$.title.error` is not `undefined` and place the `error` text as its contents.

   *src/app/home/home.component.html*
   ```html
   <div *ngIf="newTask.$.title.error">
      {{newTask.$.title.error}}
   </div>
   ```

After the browser refreshes, try creating a new `task` without title - the "Should not be empty" error message is displayed.

Attempting to modify titles of existing tasks to invalid values will also fail, but the error message is not displayed because we haven't added the template element to display it.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:4200/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:4200/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,


## Backend methods
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

### Set all tasks as un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAll` async function to the `HomeComponent` class, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/app/home/home.component.ts*
   ```ts
   async setAll(completed: boolean) {
     for await (const task of this.tasksRepo.iterate()) {
        task.completed = completed;
        await task.save();
     }
     this.loadTasks();
   }
   ```

   The `iterate` method is an alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects. The `iterate` method doesn't return an array (as the `find` method) and instead returns an `iteratable` object which supports iterations using the JavaScript `for await` statement.


2. Add the two buttons to the `home.component.html` template, immediately before the unordered list element. Both of the buttons' `click` events will call the `setAll` function with the relevant value of the `completed` argument.

   *src/app/home/home.component.html*
   ```html
   <button (click)="setAll(true)">Set all as completed</button> 
   <button (click)="setAll(false)">Set all as uncompleted</button>
   ```

Make sure the buttons are working as expected before moving on to the next step.
### Refactoring `setAll` to have it run on the server
With the current state of the `setAll` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

A simple way to prevent this is to expose an API endpoint for `setAll` requests, and run the same logic on the server instead of the client.

Refactor the `for await` loop from the `setAll` function of the `HomeComponent` class into a new, `static`, `setAll` function in the `Task` entity,  which will run on the server.

*src/app/home/task.ts*
```ts
@BackendMethod({ allowed: true })
static async setAll(completed: boolean, remult?: Remult) {
   for await (const task of remult!.repo(Task).iterate()) {
      task.completed = completed;
      await task.save();
   }
}
```
*src/app/home/home.component.ts*
```ts{2}
async setAll(completed: boolean) {
   await Task.setAll(completed);
   this.loadTasks();
}
```

::: danger Import BackendMethod
Don't forget to import `BackendMethod` and `Remult` from `remult` for this code to work.
:::

The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (the `allowed` property will be discussed later on in this tutorial). 

The optional `remult` argument of the static `setAll` function is omitted in the client-side calling code, and injected by Remult on the server-side with a server `Remult` object. **Unlike the client implementation of the Remult `Remult`, the server implementation interacts directly with the database.**

::: warning Note
With Remult backend methods, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the "Set all..." buttons function exactly the same, but they will do the work much faster.

## Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism which enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field level authorization code should be placed in entity classes**.

User authentication remains outside the scope of Remult. In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

### Tasks CRUD operations require sign in
This rule is implemented within the `Task` entity class constructor, by modifying the `allowApiCrud` property of the anonymous implementation of the argument sent to the `@Entity` decorator, from a `true` value to an arrow function which accepts a Remult `Remult` object and returns the result of the remult's `authenticated` method.

*src/app/home/task.ts*
```ts{2}
@Entity("tasks", {
    allowApiCrud: Allow.authenticated
})
```

After the browser refreshes, the list of tasks disappeared and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL
```sh
curl -i http://localhost:4200/api/tasks
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `Task`.

*src/app/home/task.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
:::

### Hide UI for non-authenticated users
*src/app/home/home.component.html*
```html{1,24}
<ng-container *ngIf="remult.authenticated()">
  <div>
    <input [(ngModel)]="newTask.title" placeholder="Title">
    <button (click)="createNewTask()">Create new task</button>
    <div *ngIf="newTask.$.title.error">
      {{newTask.$.title.error}}
   </div>
  </div>
  <ul>
    <li *ngFor="let task of tasks">
      <input [(ngModel)]="task.completed" type="checkbox">
      <input [(ngModel)]="task.title" 
         [style.textDecoration]="task.completed?'line-through':''">
      <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
      <button (click)="deleteTask(task)">Delete</button>
    </li>
  </ul>
  <p>
    <input type="checkbox" id="hideCompleted" [(ngModel)]="hideCompleted" (change)="loadTasks()">
    <label for="hideCompleted">Hide completed</label>
  </p>
  <button (click)="setAll(true)">Set all as completed</button> 
  <button (click)="setAll(false)">Set all as uncompleted</button>
</ng-container>
```

*src/app/home/home.component.ts*
```ts{2}
async loadTasks() {
  if (this.remult.authenticated())
    this.tasks = await this.tasksRepo.find({
      where: this.hideCompleted ? { completed: false } : {},
      orderBy: { completed: "asc" }
    });
}
```

To test this functionality, click the `Sign Up` button at the top right of the page and create your user - sign in and out to see that this functionality works.

After you Sign In, you can Sign out by clicking the `Sign Out` button on the top left.

### User Management
The first user that signs in is by default the application's `Admin` and has access to the `User Accounts` menu entry where users can be managed.

Here you can manage the users and reset their password.

### Role-based authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo list, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. In the `src/app/users/role.ts` file you can see the defined `admin` role which we'll use:

   *src/app/users/role.ts*
   ```ts
   export const Roles = {
      admin: 'admin'
   }
   ```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

   *src/app/home/task.ts*
   ```ts{2,5-8,13,19}
   import { Field, Entity, IdEntity, Validators, BackendMethod, Remult, Allow } from "remult";
   import { Roles } from "../users/roles";
   
   @Entity("tasks", {
       allowApiRead: Allow.authenticated,
       allowApiUpdate: Allow.authenticated,
       allowApiInsert: Roles.admin,
       allowApiDelete: Roles.admin
   })
   export class Task extends IdEntity {
       @Field({
           validate: Validators.required,
           allowApiUpdate: Roles.admin
       })
       title: string = '';
       @Field()
       completed: boolean = false;
   
       @BackendMethod({ allowed: Roles.admin })
       static async setAll(completed: boolean, remult?: Remult) {
           for await (const task of remult!.repo(Task).iterate()) {
               task.completed = completed;
               await task.save();
           }
       }
   }

   ```
**Create a new Sign in, to test that the actions restricted to `admin` users are not allowed. :lock:**



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

Run
```sh
heroku apps:create 
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
heroku config:set TOKEN_SIGN_KEY=some-very-secret-key
```

### Step 5 Deploy the application using git
```sh
git push heroku master 
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

Or if you're lazy, here are the 5 lines in one copy and paste:
```sh
heroku apps:create 
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set TOKEN_SIGN_KEY=some-very-secret-key
git push heroku master 
heroku apps:open
```

### Doing it all with a user interface
Heroku has a web user interface to setup your app, define the db and set the config vars, you may find it easier to use.



### We're done
That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
