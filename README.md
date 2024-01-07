<div align="center">
  <a href="http://remult.dev/">
    <img src="https://github.com/remult/remult/raw/master/docs/public/logo.png" width="140" height="140">
  </a>
  <h1>Remult</h1>
  <p>Full-stack CRUD, simplified, with SSOT TypeScript entities</p>
	<a href="https://circleci.com/gh/remult/remult/tree/master" rel="nofollow">
		<img alt="CircleCI" src="https://circleci.com/gh/remult/remult/tree/master.svg?style=shield">
	</a>
	<a href="https://codecov.io/gh/remult/remult" rel="nofollow">
        	<img src="https://codecov.io/gh/remult/remult/branch/master/graph/badge.svg?token=LYWQRUN3D1"/>
      	</a>
    	<a href="https://raw.githubusercontent.com/remult/remult/master/LICENSE" rel="nofollow">
		<img alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg">
	</a>
	<a href="https://www.npmjs.com/package/remult" rel="nofollow">
		<img alt="npm version" src="https://badge.fury.io/js/remult.svg">
	</a>
	<a href="https://www.npmjs.com/package/remult" rel="nofollow">
		<img alt="npm downloads" src="https://img.shields.io/npm/dm/remult">
	</a>
	<a href="https://discord.gg/GXHk7ZfuG5" rel="nofollow">
		<img alt="Join Discord" src="https://badgen.net/discord/online-members/GXHk7ZfuG5?icon=discord&label=Discord"/>
	</a>
</div>

<br/>

<div align="center">
  <a href="#tutorials">Tutorials</a> |
  <a href="https://remult.dev/docs/quickstart">Quickstart</a> |
  <a href="https://remult.dev/docs/example-apps">Example Apps</a>
</div>

<hr/>
<br/>

<a href="https://www.youtube.com/watch?v=rEoScmSVNUE" target="_blank">
  <p align="center">
    <img src="https://github.com/remult/remult/raw/master/static/images/video-thumbnail.jpg" alt="Video thumbnail"  />
  </p>
</a>

<a href="https://www.youtube.com/watch?v=rEoScmSVNUE" target="_blank">
  <p align="center">Watch code demo on YouTube here (14 mins)</p>
</a>

## What is Remult?

**Remult** is a full-stack CRUD framework that uses your **TypeScript entities
as a single source of truth for your API, frontend type-safe API client and
backend ORM**.

- :zap: Zero-boilerplate CRUD API routes with paging, sorting, and filtering for Express / Fastify / Next.js / NestJS / Koa / others...
- :ok_hand: Fullstack type-safety for API queries, mutations and RPC, without code generation
- :sparkles: Input validation, defined once, runs both on the backend and on the frontend for best UX
- :lock: Fine-grained code-based API authorization
- :relieved: Incrementally adoptable
- :rocket: Production ready
- :mega: **NEW - Zero-boilerplate realtime live-queries**

### Status

Remult is **production-ready** and, in fact, used in production apps since 2018.
However, we’re keeping the major version at zero so we can use community
feedback to finalize the v1 API.

## Motivation

Full-stack web development is (still) too complicated. **Simple CRUD, a common
requirement of any business application, should be simple to build, maintain,
and extend** when the need arises.

Remult abstracts away repetitive, boilerplate, error-prone, and poorly designed
code on the one hand, and enables total flexibility and control on the other.
**Remult helps building fullstack apps using only TypeScript code you can easily
follow and safely refactor**, and fits nicely into any existing or new project
by being minimalistic and completely unopinionated regarding the developer’s
choice of other frameworks and tools.

Other frameworks tend to fall into either too much abstraction (no-code,
low-code, BaaS) or partial abstraction (MVC frameworks, GraphQL, ORMs, API
generators, code generators), and tend to be opinionated regarding the
development tool-chain, deployment environment, configuration/conventions or
DSL. Remult attempts to strike a better balance.

## Installation

The _remult_ package is one and the same for both the frontend bundle and the
backend. Install it once for a monolith project or per-repo in a monorepo.

```sh
npm i remult
```

## Usage

### Define model classes

```ts
// shared/product.ts

import { Entity, Fields } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.string()
  name = ''

  @Fields.number()
  unitPrice = 0
}
```

### Setup API backend using an Express middleware

```ts
// backend/index.ts

import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Product } from '../shared/product'

const port = 3001
const app = express()

app.use(
  remultExpress({
    entities: [Product],
  }),
)

app.listen(port, () => {
  console.log(`Example API listening at http://localhost:${port}`)
})
```

### :rocket: API Ready

```sh
> curl http://localhost:3001/api/products

[{"name":"Tofu","unitPrice":5}]
```

### Find and manipulate data in type-safe frontend code

```ts
// frontend/code.ts

import { remult } from 'remult'
import { Product } from '../shared/product'

async function increasePriceOfTofu(priceIncrease: number) {
  const productsRepo = remult.repo(Product)

  const product = await productsRepo.findFirst({ name: 'Tofu' }) // filter is passed through API request all the way to the db
  product.unitPrice += priceIncrease
  productsRepo.save(product) // mutation request updates the db with no boilerplate code
}
```

### ..._exactly_ the same way as in backend code

```ts
@BackendMethod({ allowed: Allow.authenticated })
static async increasePriceOfTofu(priceIncrease: number) {
  const productsRepo = remult.repo(Product);

  const product = await productsRepo.findFirst({ name: 'Tofu' }); // use Remult in the backend as an ORM
  product.unitPrice += priceIncrease;
  productsRepo.save(product);
}
```

### :ballot_box_with_check: Data validation and constraints - defined once

```ts
import { Entity, Fields, Validators } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.string({
    validate: Validators.required,
  })
  name = ''

  @Fields.string<Product>({
    validate: (product) => {
      if (product.description.trim().length < 50) {
        throw 'too short'
      }
    },
  })
  description = ''

  @Fields.number({
    validate: (_, field) => {
      if (field.value < 0) {
        field.error = 'must not be less than 0' // or: throw "must not be less than 0";
      }
    },
  })
  unitPrice = 0
}
```

### Enforced in frontend:

```ts
const product = productsRepo.create()

try {
  await productsRepo.save(product)
} catch (e: any) {
  console.error(e.message) // Browser console will display - "Name: required"
}
```

### Enforced in backend:

```sh
> curl http://localhost:3001/api/products -H "Content-Type: application/json" -d "{""unitPrice"":-1}"

{"modelState":{"unitPrice":"must not be less than 0","name":"required"},"message":"Name: required"}
```

### :lock: Secure the API with fine-grained authorization

```ts
@Entity<Article>('Articles', {
  allowApiRead: true,
  allowApiInsert: (_, remult) => remult.authenticated(),
  allowApiUpdate: (article, remult) => article.author.id == remult.user.id,
})
export class Article {
  @Fields.string({ allowApiUpdate: false })
  slug = ''

  @Field(() => Profile, { allowApiUpdate: false })
  author!: Profile

  @Fields.string()
  content = ''
}
```

## What about complex CRUD?

While simple CRUD shouldn’t require any backend coding, using Remult means
having the ability to handle any complex scenario by controlling the backend in
numerous ways:

- Backend computed (read-only) fields - from simple
  [expressions](https://remult.dev/docs/ref_field.html#serverexpression) to
  complex data lookups or even direct db access (SQL)
- Custom side-effects with
  [entity lifecycle hooks](https://remult.dev/docs/ref_entity.html#saving)
  (before/after saving/deleting)
- Backend only updatable fields (e.g. “last updated at”)
- Many-to-one [relations](https://remult.dev/docs/entity-relations.html) with
  [lazy/eager loading](https://remult.dev/docs/lazy-loading-of-related-entities.html)
- Roll-your-own type-safe endpoints with
  [Backend Methods](https://remult.dev/docs/backendMethods.html)
- Roll-your-own low-level endpoints (Express, Fastify, koa, others…)

## Tutorials

The best way to learn Remult is by following a tutorial of a simple Todo web app
with a Node.js Express backend.

- [Tutorial with React](https://remult.dev/tutorials/react/)
- [Tutorial with Angular](https://remult.dev/tutorials/angular/)
- [Tutorial with Vue](https://remult.dev/tutorials/vue/)
- [Tutorial with Next.js](https://remult.dev/tutorials/react-next/)
- [Tutorial with Sveltekit](https://remult.dev/tutorials/sveltekit/)

## Documentation

The [documentation](https://remult.dev/docs) covers the main features of Remult.
However, it is still a work-in-progress.

## Example Apps

- Fullstack TodoMVC example with React and Express.
  ([Source code](https://github.com/remult/TodoMVC-eample) |
  [CodeSandbox](https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx))

- [CRM demo](https://github.com/remult/crm-demo) with a React +
  [MUI](https://mui.com) front-end and Postgres database.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

- :speech_balloon: Any feedback or suggestions? Start a
  [discussion](https://github.com/remult/remult/discussions).
- :muscle: Want to help out? Look for "help wanted" labeled
  [issues](https://github.com/remult/remult/issues).
- :star: Give this repo a star.

## License

Remult is [MIT Licensed](LICENSE).
