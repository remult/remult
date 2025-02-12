# CRUD your first Entity

## Define an Entity Model Class

Remult entity classes are shared between frontend and backend code.

```ts
// shared/product.ts

import { Entity, Fields } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.uuid()
  id!: string

  @Fields.string()
  name = ''

  @Fields.number()
  unitPrice = 0
}
```

Alternatively, [generate entities from an existing Postgres database](./entities-codegen-from-db-schema.md).

## Register the Entity on the Server

All Remult server middleware options contain an `entities` array. Use it to register your Entity.

```ts
// backend/index.ts

import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Product } from '../shared/product'

const app = express()

app.use(
  remultExpress({
    entities: [Product],
  }),
)
```

## Query and Mutate data in Front-end code

```ts
// frontend/code.ts

import { repo } from 'remult'
import { Product } from '../shared/product'

const productsRepo = repo(Product)

async function playWithRemult() {
  // add a new product to the backend database
  await productsRepo.insert({ name: 'Tofu', unitPrice: 5 })

  // fetch products from backend database
  const products = await productsRepo.find()
  console.log(products)

  // update product data
  const tofu = products.filter((p) => p.name === 'Tofu')
  await productsRepo.save({ ...tofu, unitPrice: tofu.unitPrice + 5 })

  // delete product
  await productsRepo.delete(tofu)
}

playWithRemult()
```
