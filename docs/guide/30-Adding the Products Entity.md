# Adding an Entity
At this stage we would like to define the product Entity, where we will store our product information.
Let's add a new file under the `Products` folder, called `products.ts`


<<< @/docs-code/products/products.ts

Let's review:
1. We've added a `Products` class that extends the `IdEntity` class from `@remult/core`. This will create an `Entity` that will have an `id` column that is unique, and anything else we would like to add to it.
2. On line 5 we've defined a `name` column (the product name)
3. On line 7 we've called the `super` class's constructor and defined:
   1.  Line 8 - the `name` for our `API` 
   2.  Line 9 - `allowApiCRUD` determined that CRUD operations are allowed in the `API` (**C**reate **R**ead **U**pdate **D**elete)
   

>The `allowApiCRUD` properties are set by default to false, to secure the data of your application, you may want to restrict access to this data and we want to make sure that data will not be exposed by default. Later we'll review how to control access to data.

## Using the Entity in a Component
Now let's add a grid on the `ProductsComponent` that displays the `Products` Entity.

We are using the `data-grid` and `GridSettings` objects from `remult`. The `data-grid` is a quick and easy to use data grid that is intended to help you create admin screens with ease. For more info on it see [Data Grid](datagrid)

in `products.component.ts`

<<< @/docs-code/products/products.component.ts{12-15} 

let's review:
1. We've added the required imports (those are added automatically when typing the names later on and allowing vscode to add them. See "adding the import statements" note below)
2. We've added a parameter to the constructor called `context` of type `Context` from `@remult/core`. This object will help us get data from the server and more. by tagging it as `private` we make it available throughout the class, by using `this.context`
3. We've added the definition of `products` in this component. We've asked the context to provide us with `gridSettings` for the `Entity` Products - and we've configured it to allow update insert and delete.



:::tip adding the import statements
 When you'll add the `context` parameter to the constructor, you'll also require the `import` statement for the `Context` class.

 If you don't already have that import statement, Visual Studio Code will highlight the parameter type in red and display a "light bulb" you can click to automatically add it:

![](/2020-01-26_11h45_50.png)

 It'll then automatically add the `import { Context } from '@remult/core';` statement to the top of the document.

 The same can be done for any missing `import` statement 
:::

## Placing the data-grid in the html
and in the `products.component.html`

<<< @/docs-code/products/products.component.html

let's review:
1. We've replaced the `html` with a `data-grid` tag that will display the grid settings provided in the `products` member of the `products.component.ts` file.
2. We've determined a fixed height of 300 pixels.

## The result on the server
Now if we'll look at the bottom of our screen, at the Terminal output for the task `node-serve`, we'll see that the server restarted and a new api is now available:
```{2-5,11}
start verify structure
create table Products (
  id varchar default '' not null  primary key,
  name varchar default '' not null
)
/api/Users_methods/create
/api/Users_methods/updatePassword
/api/resetPassword
/api/signIn
/api/Users
/api/Products
```
Let's review:
1. When the server restarted, it checked if a `Products` table exists in the database, and since it didn't exist it created it in lines 9-12.
2. On line 16 it added an api endpoint for our `Products` `Entity`


When we'll review the products page, we'll be able to see an empty grid with a column called `id` and a column called `name`, we can add new rows by clicking on the `+` sign at the bottom, and saving them when we edit them.

Let's add a few products:
1. Beer
2. Wine
3. Bread

## Viewing the Rest Api
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

## Adding More Columns
let's add a price, and availability dates to the `Products` entity

In the `products.ts` file

<<< @/docs-code/products-batch-operations/products.ts{6-8}



Once we've added these columns we'll be able to see in the `node-serve` terminal window that these columns were added to our database:
```{2-4}
start verify structure
alter table Products add column price int default 0 not null
alter table Products add column availableFrom date
alter table Products add column availableTo date
/api/Users_methods/create
/api/Users_methods/updatePassword
/api/resetPassword
/api/signIn
/api/Products
/api/Users
```

And when we'll look at the browser, we'll see that there are 3 more columns to the grid