---
home: true

tagline: 
actionText: Quick Start →
actionLink: /guide/
features:
- title: Fullstack
  details: Handlers both front end and server concerns
- title: Single Fully Typed code base
  details: For both server and client
- title: Security and Authorization
  details: Fine grained end-to-end security and authorization

footer: Made by the Remult team with ❤️
---
### Remult is based on entities

An Entity object is defined once and is used on the server and in the browser. For example:

<<< @/docs-code/products-batch-operations/products.ts 

Then you query that entity using the following code.
```ts
await this.context.for(Products).find({
    orderBy: p => p.name,
    where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
                p.availableTo.isGreaterOrEqualTo(new Date()))
});
```


This same code can run in the browser and produce http calls to the api that is automatically generated from the `Entity`'s definition, or this code can run on the server and interact with the database of your choice - in both cases returning a fully typed object for you to use.

### Backend Methods
You can also easily create functions that run on the server, using the same code and end-to-end type safety.
```ts
async updatePrice() {
    await ProductsComponent.updatePriceOnBackend(Number.parseInt(this.priceInput));
    this.products.reloadData();
  }
  @BackendMethod({ allowed: true })
  static async updatePriceOnBackend(priceToUpdate: number, context?: Context) {
    for await (const p of context.for(Products).iterate()) {
      p.price += priceToUpdate
      await p.save();
    }
  }
```
### Fine grained end-to-end security and authorization
You can control which user is allowed to see which part of the api and `Entity` object, with a built in mechanism.
```ts{3-4,8,12}
@Entity({
    key: 'Products',
    allowApiCrud: Roles.admin,
    allowApiRead: context => context.isSignedIn()
})
export class Products extends IdEntity {
    @Field({
        allowApiUpdate: Roles.admin
    })
    name: string;
    @Field({
        includeInApi: context => context.isSignedIn()
    })
    price: number = 0;
    @DateOnlyField()
    availableFrom: Date;
    @DateOnlyField()
    availableTo: Date;
}
```

All api endpoints are secured by design, and were built to resist sql injection, xss etc...