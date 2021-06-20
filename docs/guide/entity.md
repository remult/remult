# Working with Entities

An entity is the basic building block of an application, it represents an entity and is usually stored in a database table.
It'll be automatically created in the db, and will have an automatic rest api that exposes it to the world.

And `Entity` will be decorated by the `EntityClass` decorator, and extend the `IdEntity` base class (in most cases)

If it's constructor receives a `Context` parameter, one will be automatically injected to it.

And `Entity` will always be created by the `context` object.

## Here's a sample entity:

<<< @/docs-code/products/products.ts 

The Entity configuration can be determined by the `settings` object that is being sent to the `@Entity` decorator


See the [EntitySettings](ref_entitysettings) docs for all the different options.

##  The Context class
Most of the work with entity will be done using the `Context` object.
The `Context` object is responsible for providing Entity instances with their data already populated. Here are a a few usage examples:

## find
```ts
let products = await context.for(Products).find();
for (const p of products) {
    console.log(p.name);
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

For more methods see the docs for [SpecificEntityHelper](ref_specificentityhelper)

## Working with the result set
When we get a result set of entities, we can perform actions on them, update them, save them etc...

```ts
for await (let p of this.context.for(Products).iterate()){
    p.price += 5;
    await p.save();
}
```

For Entity methods see [Entity](ref_entity)