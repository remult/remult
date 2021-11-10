# Remult
![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg) [![npm version](https://badge.fury.io/js/remult.svg)](https://badge.fury.io/js/remult)

Remult is an unopinionated CRUD framework for fullstack TypeScript.
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