<div align="center">
  <a href="http://remult.dev/">
    <img src="https://github.com/remult/remult/raw/master/docs/public/logo.png" width="140" height="140">
  </a>
  <h1>Remult</h1>
  <p>Full-stack CRUD, simplified, with SSOT TypeScript entities</p>
	<a href="https://circleci.com/gh/remult/remult/tree/master" rel="nofollow">
		<img alt="CircleCI" src="https://circleci.com/gh/remult/remult/tree/master.svg?style=shield"></a>
	<a href="https://codecov.io/gh/remult/remult" rel="nofollow">
        	<img src="https://codecov.io/gh/remult/remult/branch/master/graph/badge.svg?token=LYWQRUN3D1"/></a>
    	<a href="https://raw.githubusercontent.com/remult/remult/master/LICENSE" rel="nofollow">
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

**Remult** is a full-stack CRUD framework that uses your **TypeScript entities
as a single source of truth for your API, frontend type-safe API client and
backend ORM**.

- :ok_hand: Fullstack type-safety for API queries, mutations and RPC, without code generation
- :sparkles: Input validation, defined once, runs both on the backend and on the frontend for best UX
- :lock: Fine-grained code-based API authorization
- :zap: Zero-boilerplate CRUD API routes with paging, sorting, and filtering for Express / Fastify / Next.js / Nuxt / Sveltekit / Nest / Hapi / Hono / Koa others...
- :page_with_curl: Database - Postgres / MySQL / MongoDB / SQLite / Sql Server / Oracle ...
- :relieved: Can be easly added to your existing projects
- :mega: **NEW - Zero-boilerplate realtime live-queries**

## Usage

### Consistent Type-safe Query language that works both on **Frontend** and **Backend**

```ts
await repo(Product).find({
  limit: 10,
  orderBy: {
    name: 'asc',
  },
  where: {
    unitPrice: { $gt: 5 },
  },
})
// Frontend: GET: '/api/products?_limit=10&unitPrice.gt=5,_sort=name'
// Backend: select name, unitPrice from products where unitprice > 5 order by name limit 10
```

### Type-safe Data Manipulation that works both on **Frontend** and **Backend**

```ts
await repo(Product).update('product7', { unitPrice: 7 })

// Frontend: PUT: '/api/products/product7 Body:{ "unitPrice" : 7 }'
// Backend: update products set unitPrice = 7 where id = ?
```

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

### Setup API backend using Express / Fastify / Next.js / Nuxt / Sveltekit / Nest / Hapi / Hono / Koa

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

Automatic **CRUD Rest API**, and support for **OpenAPI** & **GraphQL**

See [Quickstart - Server-side Initialization](https://remult.dev/docs/quickstart#server-side-initialization) for Fastify / Next.js / Nuxt / Sveltekit / Nest / Hapi / Hono / Koa

### Easy Database configuration for Postgres / MySQL / MongoDB / SQLite / Sql Server / Oracle / others

```ts
remultExpress({
  entities,
  dataProvider: createPostgresDataProvider({
    connectionString: 'postgres://user:password@host:5432/database"',
  }),
})
```

See [Quickstart - Conneting a Database](https://remult.dev/docs/quickstart#connecting-a-database) for databases configuration

### :mega: Realtime Live Queries

```ts
repo(Product)
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
    console.log(info.items)
  })
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
  /* Browser console will display a structured error that can be used to show the correct ror next to the correct html input
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
  orderBy: { name: 'asc ' },
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

### Built-in admin UI

![admin UI](https://private-user-images.githubusercontent.com/16635859/303906644-067558d3-7587-4c24-ae84-38bbfe9390af.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTE0MzYxMzYsIm5iZiI6MTcxMTQzNTgzNiwicGF0aCI6Ii8xNjYzNTg1OS8zMDM5MDY2NDQtMDY3NTU4ZDMtNzU4Ny00YzI0LWFlODQtMzhiYmZlOTM5MGFmLmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDAzMjYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQwMzI2VDA2NTAzNlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTdlNTY1ZTNjODRiOGM3Y2RjZWIyZTBjMGZlNDU0MTg4Zjc3NzUxNGIzMDhhZTk4Yzg2ZTIyZDkzNjA4M2U0NzImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JmFjdG9yX2lkPTAma2V5X2lkPTAmcmVwb19pZD0wIn0.Om8eVpH24_tQRZh40P6wQSu5rQOT26PaeTsUYAF8V8g)

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

<a href="https://www.youtube.com/watch?v=rEoScmSVNUE" target="_blank">
  <p align="center">
    <img src="https://github.com/remult/remult/raw/master/static/images/video-thumbnail.jpg" alt="Video thumbnail"  />
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

## Installation

The _remult_ package is one and the same for both the frontend bundle and the
backend. Install it once for a monolith project or per-repo in a monorepo.

```sh
npm i remult
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

- :speech_balloon: Any feedback or suggestions? Start a
  [discussion](https://github.com/remult/remult/discussions).
- :muscle: Want to help out? Look for "help wanted" labeled
  [issues](https://github.com/remult/remult/issues).
- :star: Give this repo a star.

## License

Remult is [MIT Licensed](LICENSE).
