# Architecture

In this article we'll cover the different architecture artifacts and their roles in both the development process and the production environment

## The Development Environment
![](/development-architecture.png)

* **Browser** (AKA frontend) - that's where the user uses the application, it's either on a mobile device or a desktop. The Browser runs the html, and javascript files that provides the user with the user experience. 

* **Angular Dev Server** - The Angular development server is responsible for automatically refreshing the browser window, whenever we make a change to any of the html or Typescript files in our development work. It also "compiles" the Typescript code that we write, into the javascript code that runs in the browser. Usually runs on port 4200.

* **Node JS Web Server** (AKA backend)- Provides a Rest API that serves the data that the application needs in the browser, and performs all the server side business logic of the application. Usually runs on port 3000.

* **Database** - Stores the data that the application needs

### Angular Dev Server and The Rest API calls

Since the `Angular Dev Server` is only responsible for "compiling" the html and javascript files that the application needs in the browser and since it's only used while we develop, it can't process the `Rest api` calls by itself.

Instead it forwards these calls to the `Node JS` server for processing.

This is configured in the `proxy.conf.json` file.


### Running the development environment
To work in development we'll need to run two tasks:
1. `ng-serve` - Runs the **Angular Dev Server**
    ```sh
    npm run ng-serve
    ```
2. `node-serve` - does several things:
    ```sh
    npm run node-serve
    ```
    1. "Compiles" the `typescript` code that we write, to the `javascript` code that the `Node JS` server can run. 
    2. Runs the `Node JS` server once the "compilation" is complete.
    3. Whenever we make a change to any of the `typescript` files, it'll repeat steps 1 and 2.
    

## Building the project
To build the project, we run:
```sh
npm run build
```
This performs the following tasks:
1. Runs angular build, which "compiles" and minifies all the `typescript`, html and scss files and places them in the `./dist` folder.
2. "compiles" all the `typescript` files that are used by the `server` and places them in the `./dist-server` folder.

## The Production Environment
![](/production-architecture.png) 

To run the application in production, we'll run the `Node JS` server using the following command:
```sh
npm run start
```
:::tip note
While in production the `Node JS` server, takes on the role of serving the javascript and html files that were built in the `build` process from the `./dist` folder
:::