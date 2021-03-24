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
To work in development we'll run the `dev` task which in turn will run two tasks:
1. `dev-ng` - Runs the **Angular Dev Server**
    ```sh
    npm run dev-ng
    ```
2. `dev-node` - does several things:
    ```sh
    npm run dev-node
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
1. Runs angular build, which "compiles" and minifies all the `typescript`, html and scss files and places them in the `./dist/my-project` folder.
2. "compiles" all the `typescript` files that are used by the `server` and places them in the `./dist/server` folder.

## The Production Environment
![](/production-architecture.png) 

To run the application in production, we'll run the `Node JS` server using the following command:
```sh
npm run start
```
:::tip note
While in production the `Node JS` server, takes on the role of serving the javascript and html files that were built in the `build` process from the `./dist` folder
:::

## Where does remult fit into all of this
remult is a library that is used both in the browser and in the server. It allows you to write your classes once and use them both on the server and on the client, preventing duplicate code and mismatch errors.
It handles the communication between the server and the client, and also generates the sql statements required to access the data from the db.
It handles security concerns and server/client concerns so that you the developer can focus on the business problem you are trying to solve.



### Let's use an example to demonstrate that

An Entity object is defined once and is used on the server and in the browser. For example:

<<< @/docs-code/products-batch-operations/products.ts


When you write the following code which runs in the browser:
```ts
await this.context.for(Products).find({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
});
```
remult will issue an http call to the server using rest, which will look like this:
```url
http://localhost:4200/api/Products?availableFrom_lte=2020-08-05&availableTo_gte=2020-08-05&_sort=name&_order=asc
```

the remult library on the server will process this url, and run the following sql statement to the database:
```sql
  select id, name, price, availableFrom, availableTo 
    from Products 
   where availableFrom <= $1 and availableTo >= $2 
Order By name
Arguments: { '$1': '2020-08-05', '$2': '2020-08-05' }
```

The server will then return the data in JSON format to be consumed in the browser:
```JSON
[
    {
        "id":"7668da48-e773-459d-90a5-44cfb0844b4e",
        "name":"Bread",
        "price":75,
        "availableFrom":"2001-01-01",
        "availableTo":"9999-12-31"
    },
    {
        "id":"b2069675-586a-4a9d-b85b-c519c7e09162",
        "name":"Wine",
        "price":124,
        "availableFrom":"2019-11-07",
        "availableTo":"9999-12-31"
    }
]
```
#### On the Server
If we'll run the same code - on the server:
```ts
await this.context.for(Products).find({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
});
```

it'll generate the following sql statement and use it:
```sql
  select id, name, price, availableFrom, availableTo 
    from Products 
   where availableFrom <= $1 and availableTo >= $2 
Order By name
Arguments: { '$1': '2020-08-05', '$2': '2020-08-05' }
```

#### Authorized and secured
All of this is done in a secured manner that makes sure that the correct options are available to the correct user

### UI
remult also provides a ready set of angular controls that can be used for the admin console in the application you write including a `data-grid`, `data-area` and `data-control` that are used to display data.