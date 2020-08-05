# Working with Entities

An entity is the basic building block of an application, it represents an entity and is usually stored in a database table.
It'll be automatically created in the db, and will have an automatic rest api that exposes it to the world.

And `Entity` will be decorated by the `EntityClass` decorator, and extend the `IdEntity` base class (in most cases)

If it's constructor receives a `Context` parameter, one will be automatically injected to it.

And `Entity` will always be created by the `context` object.

## Here's a sample entity:

<<< @/docs-code/products/products.ts

The Entity configuration can be determined by the `options` object that is being sent to the `super` method (the constructor of it's base class)


See the object itself for more info about the different properties and their usage.

##  The Context class
Most of the work with entity will be done using the `Context` object.
The `Context` object is responsible for providing Entity instances with their data already populated. Here are a a few usage examples:

## find
```ts
let products = await context.for(Products).find();
for (const p of products) {
    console.log(p.name.value);
}
```
in this example we get an array of products and write their names to the console.

The find method can also be used with a where and order by:

```ts
this.products = await this.context.for(Products).find({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
});
```

## findFirst
Gets only the first row that matches the rule
```ts
let p = await context.for(Products).findFirst({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
})
```

## findId
Used to find a single row by it's it
```ts
let p = await context.for(Products).findId(productId);
```

## lookup
Used to get non critical values from the Entity.
The first time this method is called, it'll return a new instance of the Entity.
It'll them call the server to get the actual value and cache it.
Once the value is back from the server, any following call to this method will return the cached row.

It was designed for displaying a value from a lookup table on the ui - counting on the fact that it'll be called multiple times and eventually return the correct value.

```ts
return  context.for(Products).lookup(p=>p.id.isEqualTo(productId));
```
Note that this method is not called with `await` since it doesn't wait for the value to be fetched from the server.


## create
Used to create a new instance (row) of the Entity
```ts
let p = context.for(Products).create();
p.name.value = "Wine";
await p.save();
```