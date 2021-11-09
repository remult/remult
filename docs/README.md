---
home: true

heroImage: /logo.png
tagline: Unopinionated CRUD for fullstack TypeScript
actionText: Quick Start →
actionLink: /guide/

features:
- title: API Included
  details: |
    Secured API is auto generated from model type definitions, and consumed by frontend strongly typed queries/mutations. 
    The generated API can also be used by apps & third-parties.
- title: No Boilerplate. No Scaffolding
  details: Simple CRUD from frontend to database just works. Smart hooks make it super easy to control data transformation, validations and CRUD events.
- title: Highly Declarative. Always Typed
  details: Model metadata and declarative code affect both frontend and backend, eliminating redundant, error-prone duplication. The same coding style can be used to find and manipulate data in both frontend and backend code. 

footer: Made by the Remult team with ❤️ 
---
### Define Entity classes
```ts
import { Entity, EntityBase, Field } from 'remult';

@Entity('Products', {
    allowApiCrud: true
})
export class Product extends EntityBase {
  @Field()
  name: string = '';

  @Field()
  unitPrice: number = 0;
}
```
### Find and manipulate data in front end code...
```ts
static increasePriceOfTofu(priceIncrease: number) {
  const product = await remult.repo(Product).findFirst({ name:'Tofu' });

  product.unitPrice += priceIncrease;
  await product.save();
}
```
### ...*exactly* the same way as in back end code
```ts
@BackendMethod({ allowed: Allow.authenticated })
static increasePriceOfTofu(priceIncrease: number, remult?: Remult) {
  const product = await remult.repo(Product).findFirst({ name:'Tofu' });

  product.unitPrice += priceIncrease;
  await product.save();
}
```

### Secure the API with Fine-grained Authorization
```ts
@Entity<Article>('Articles', {
    allowApiRead: true,
    allowApiInsert: remult => remult.authenticated(),
    allowApiUpdate: (remult, article) => article.author.id == remult.user.id
})
export class Article extends EntityBase {
    @Field({ allowApiUpdate: false })
    slug: string;
    
    @Field({ allowApiUpdate: false })
    author: Profile;

    @Field()
    content: string;
}
```

## Remult handles the REST:
* Secured back-end API endpoints for Entities and back-end methods
* CRUD API requests (front end) / database commands (back end)
* Object-relational mapping
* Validations
* Caching
* Authorization

## Installation
```sh
npm i remult
```

## API Setup using Express
```ts
import * as express from 'express';
import { remultExpress } from 'remult/remult-express';
import 'entities';

let app = express();
app.use(remultExpress());
app.listen(3002, () => console.log("Server started"));
```