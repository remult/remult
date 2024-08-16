<div align="center">
  <h1>Remult</h1>
  <p>Full-stack CRUD, simplified, with SSOT TypeScript entities</p>
	<a href="https://circleci.com/gh/remult/remult/tree/main" rel="nofollow">
		<img alt="CircleCI" src="https://circleci.com/gh/remult/remult/tree/main.svg?style=shield"></a>
	<a href="https://codecov.io/gh/remult/remult" rel="nofollow">
        	<img src="https://codecov.io/gh/remult/remult/branch/main/graph/badge.svg?token=LYWQRUN3D1"/></a>
    	<a href="https://raw.githubusercontent.com/remult/remult/main/LICENSE" rel="nofollow">
		<img alt="GitHub license" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
	<a href="https://www.npmjs.com/package/remult" rel="nofollow">
		<img alt="npm version" src="https://badge.fury.io/js/remult.svg"></a>
	<a href="https://www.npmjs.com/package/remult" rel="nofollow">
		<img alt="npm downloads" src="https://img.shields.io/npm/dm/remult"></a>
	<a href="https://discord.gg/GXHk7ZfuG5" rel="nofollow">
		<img alt="Join Discord" src="https://badgen.net/discord/members/GXHk7ZfuG5?icon=discord&label=Discord"/></a>
</div>

<br/>

<div align="center">
  <a href="#tutorials">Tutorials</a> |
  <a href="https://remult.dev/docs/quickstart">Quickstart</a> |
  <a href="https://remult.dev/docs/example-apps">Example Apps</a>
</div>

<hr/>
<br/>

## What is Remult?

Remult uses **TypeScript entities** as a single source of truth for: ✅ CRUD + Realtime API, ✅ frontend type-safe API client, and
✅ backend ORM.

- :zap: **Zero-boilerplate CRUD + Realtime API** with paging, sorting, and filtering
- :ok_hand: **Fullstack type-safety** for API queries, mutations and RPC, without code generation
- :sparkles: Input validation, **defined once**, runs both on the backend and on the frontend for best UX
- :lock: Fine-grained **code-based API authorization**
- :relieved: Incrementally adoptable

**Remult supports all major databases**, including: PostgreSQL, MySQL, SQLite, MongoDB, MSSQL and Oracle.

**Remult is frontend and backend framework agnostic** and comes with adapters for Express, Fastify, Next.js, Nuxt, SvelteKit, SolidStart, Nest, Koa, Hapi and Hono.

> **Want to experience Remult firsthand? [Try our interactive online tutorial](https://learn.remult.dev/).**

Remult promotes a **consistent query syntax for both frontend and Backend code**:

```ts
// Frontend - GET: /api/products?_limit=10&unitPrice.gt=5,_sort=name
// Backend  - 'select name, unitPrice from products where unitPrice > 5 order by name limit 10'
await repo(Product).find({
  limit: 10,
  orderBy: {
    name: 'asc',
  },
  where: {
    unitPrice: { $gt: 5 },
  },
})

// Frontend - PUT: '/api/products/product7' (body: { "unitPrice" : 7 })
// Backend  - 'update products set unitPrice = 7 where id = product7'
await repo(Product).update('product7', { unitPrice: 7 })
```

## Usage

### Define schema in code

```ts
// shared/product.ts

import { Entity, Fields } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.cuid()
  id = ''

  @Fields.string()
  name = ''

  @Fields.number()
  unitPrice = 0
}
```

👉 **Don't like decorators?** we have full support for [Working without decorators](https://remult.dev/docs/working-without-decorators)

### Add backend API with a [single line of code](https://remult.dev/docs/quickstart#server-side-initialization)

_Example:_

```ts
// backend/index.ts

import express from 'express'
import { remultExpress } from 'remult/remult-express' // adapters for: Fastify,Next.js, Nuxt, SvelteKit, SolidStart, Nest, more...
import { createPostgresDataProvider } from 'remult/postgres' // supported: PostgreSQL, MySQL, SQLite, MongoDB, MSSQL and Oracle
import { Product } from '../shared/product'

const app = express()

app.use(
  remultExpress({
    entities: [Product],
    dataProvider: createPostgresDataProvider({
      connectionString: 'postgres://user:password@host:5432/database"',
    }),
  }),
)

app.listen()
```

Remult adds route handlers for a fully functional REST API and realtime live-query endpoints, optionally including an [Open API](https://remult.dev/docs/adding-swagger) spec and a [GraphQL](https://remult.dev/docs/adding-graphql) endpoint

### Fetch data with type-safe frontend code

```ts
const [products, setProducts] = useState<Product[]>([])

useEffect(() => {
  repo(Product)
    .find({
      limit: 10,
      orderBy: {
        name: 'asc',
      },
      where: {
        unitPrice: { $gt: 5 },
      },
    })
    .then(setProducts)
}, [])
```

### :mega: Realtime Live Queries

```ts
useEffect(() => {
  return repo(Product)
    .liveQuery({
      limit: 10,
      orderBy: {
        name: 'asc',
      },
      where: {
        unitPrice: { $gt: 5 },
      },
    })
    .subscribe((info) => {
      setProducts(info.applyChanges)
    })
}, [])
```

### :ballot_box_with_check: Data validation and constraints - defined once

```ts
import { Entity, Fields, Validators } from 'remult'

@Entity('products', {
  allowApiCrud: true,
})
export class Product {
  @Fields.cuid()
  id = ''

  @Fields.string({
    validate: Validators.required,
  })
  name = ''

  @Fields.number<Product>({
    validate: (product) => product.unitPrice > 0 || 'must be greater than 0',
  })
  unitPrice = 0
}
```

#### Enforced in frontend:

```ts
try {
  await repo(Product).insert({ name: '', unitPrice: -1 })
} catch (e: any) {
  console.error(e)
  /* Detailed error object ->
{
  "modelState": {
    "name": "Should not be empty",
    "unitPrice": "must be greater than 0"
  },
  "message": "Name: Should not be empty"
}
*/
}
```

#### Enforced in backend:

```ts
// POST '/api/products' BODY: { "name":"", "unitPrice":-1 }
// Response: status 400, body:
{
  "modelState": {
    "name": "Should not be empty",
    "unitPrice": "must be greater than 0"
  },
  "message": "Name: Should not be empty"
}
```

### :lock: Secure the API with fine-grained authorization

```ts
@Entity<Article>('Articles', {
  allowApiRead: true,
  allowApiInsert: Allow.authenticated,
  allowApiUpdate: (article) => article.author == remult.user.id,
  apiPrefilter: () => {
    if (remult.isAllowed('admin')) return {}
    return {
      author: remult.user.id,
    }
  },
})
export class Article {
  @Fields.string({ allowApiUpdate: false })
  slug = ''

  @Fields.string({ allowApiUpdate: false })
  authorId = remult.user!.id

  @Fields.string()
  content = ''
}
```

### :rocket: Relations

```ts
await repo(Categories).find({
  orderBy: {
    name: 'asc ',
  },
  include: {
    products: {
      where: {
        unitPrice: { $gt: 5 },
      },
    },
  },
})

// Entity Definitions
export class Product {
  //...
  @Relations.toOne(Category)
  category?: Category
}
export class Category {
  //...
  @Relations.toMany<Category, Product>(() => Product, `category`)
  products?: Product[]
}
```

### Automatic admin UI

![Automatic admin UI](static/images/admin-ui.gif)

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
- [Relations](https://remult.dev/docs/entity-relations.html)
- Roll-your-own type-safe endpoints with
  [Backend Methods](https://remult.dev/docs/backendMethods.html)
- Roll-your-own low-level endpoints (Express, Fastify, koa, others…)

## Installation

The _remult_ package is one and the same for both the frontend bundle and the
backend. Install it once for a monolith project or per-repo in a monorepo.

```sh
npm i remult
```

## Tutorials

The best way to learn Remult is by following a tutorial of a simple Todo web app
with a Node.js Express backend.

- [Tutorial with React](https://remult.dev/tutorials/react/)
- [Tutorial with Angular](https://remult.dev/tutorials/angular/)
- [Tutorial with Vue](https://remult.dev/tutorials/vue/)
- [Tutorial with Next.js](https://remult.dev/tutorials/react-next/)
- [Tutorial with Sveltekit](https://remult.dev/tutorials/sveltekit/)
- [Tutorial with SolidStart](https://remult.dev/tutorials/solid-start/)

## Demo

<a href="https://www.youtube.com/watch?v=rEoScmSVNUE" target="_blank">
  <p align="center">
    <img src="https://github.com/remult/remult/raw/main/static/images/video-thumbnail.jpg" alt="Video thumbnail"  />
  </p>
</a>

<a href="https://www.youtube.com/watch?v=rEoScmSVNUE" target="_blank">
  <p align="center">Watch code demo on YouTube here (14 mins)</p>
</a>

## Documentation

The [documentation](https://remult.dev/docs) covers the main features of Remult.
However, it is still a work-in-progress.

## Example Apps

- Fullstack TodoMVC example with React and Express.
  ([Source code](https://github.com/remult/TodoMVC-eample) |
  [CodeSandbox](https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx))

- [CRM demo](https://github.com/remult/crm-demo) with a React +
  [MUI](https://mui.com) front-end and Postgres database.

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

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

- :speech_balloon: Any feedback or suggestions? Start a
  [discussion](https://github.com/remult/remult/discussions).
- :muscle: Want to help out? Look for "help wanted" labeled
  [issues](https://github.com/remult/remult/issues).
- :star: Give this repo a star.

## License

Remult is [MIT Licensed](LICENSE).
