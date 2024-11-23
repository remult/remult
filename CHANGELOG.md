# Changelog

All notable changes to this project will be documented in this file.

## [0.27.24] TBD

- Fixed issue where find options object was changed when sent to find method

## [0.27.23] 2024-11-23

- Added `min`, `max` and `range` validators by [@YonatanKra](https://github.com/YonatanKra)
- Quality of life improvements to admin by [@jycouet](https://github.com/jycouet) & [@ermincelikovic](https://github.com/ermincelikovic)
  - In the office hour with @ermincelikovic (and cursor) we :
  - reduce the column size of numbers & align right
  - manage keyboard navigation in the grid
  - manage shortcuts
  - CTRL+Enter => Save the row
  - CTRL+Esc => Cancel the tow
  - CTRL+SHIFT+Enter => Save all rows
  - CTRL+SHIFT+Esc => Cancel all rows
- Added `EntityError` - now when insert/update etc... fail they throw this specific error.
- Log queries if they are greater than equals the threshold by @arikfr in https://github.com/remult/remult/pull/571
- Fixed an issue with decorators and optional null field
- fixed issue with aggregate in query
- Fixed issue with subscribe to entity changes and relations
- Remult create adjusted for Svelte 5 by [@jycouet](https://github.com/jycouet)

## [0.27.22] 2024-11-08

- Improved support for sveltekit ssr. To configure:

  - To enable remult across all sveltekit route
    ```ts
    // src/hooks.server.ts
    import { api } from './server/api'
    export const handle = api
    ```
  - To Use remult in ssr `PageLoad` - this will leverage the `event`'s fetch to load data on the server without reloading it on the frontend, and abiding to all api rules even when it runs on the server

    ```ts
    // src/routes/+page.ts
    import { remult } from 'remult'
    import type { PageLoad } from './$types'

    export const load = (async (event) => {
      // Instruct remult to use the special svelte fetch to fetch data on server side page load
      remult.useFetch(event.fetch)
      return repo(Task).find()
    }) satisfies PageLoad
    ```

## [0.27.21] 2024-10-28

- **Added `upsert` method:**  
  The `upsert` method allows inserting or updating an entity in a single operation. If an entity matching the `where` condition is found, it is updated; otherwise, a new entity is created. This can be used for a single entity or for batch operations with an array of options.

  Example:

  ```ts
  // Single entity upsert
  await taskRepo.upsert({
    where: { title: 'task a' },
    set: { completed: true },
  })

  // Batch upsert
  await taskRepo.upsert([
    { where: { title: 'task a' }, set: { completed: true } },
    { where: { title: 'task b' }, set: { completed: true } },
  ])
  ```

- Now you can get data and aggregate info with a single request using the `query` method:

  ```ts
  const result = await repo
    .query({
      where: { completed: false },
      pageSize: 50,
      aggregates: {
        sum: ['salary'],
        average: ['age'],
      },
    })
    .paginator()
  // Accessing the items from the first page
  console.table(result.items)
  // Accessing the aggregation results
  console.log(result.aggregates.salary.sum) // Total salary sum
  ```

- Added `TestApiDataProvider` to use in unit tests that test api rules. see [tutorial](https://learn.remult.dev/in-depth/9-testing/2-testing-api-rules)
- Fixed that values that are not included will not exist in the resulting object (previously they existed with value undefined)
- Fixed that relations that were not included, will not be enumerable in the resulting object (previously they were only set to undefined)
- Fixed `serverExpression` to run whenever we're not using a `proxy` data provider (for example RestDataProvider)
- Fixed issue with `updateMany` where the `set` had `ValueListType` or relation.
- Fixed issue when updating relation id and relation in the same update, the last one will win
- Fixed makeTitle to handle all caps text
- Added experimental api for sqlRelations & sqlRelationsFilter - see [Sql Relations](https://learn.remult.dev/in-depth/6-sql-expression/3-sql-relations)

## [0.27.20] 2024-10-16

- **Added Origin IndexedDb Storage** to store entities in the frontend:

  ```ts
  const db = new JsonDataProvider(new JsonEntityIndexedDbStorage())
  console.table(await repo(Task, db).find())
  ```

- Fixed issue with required validation and relations

## [0.27.19] 2024-09-26

- Fixed issue with stackblitz async_hook replacer

## [0.27.18] 2024-09-24

- Added `remult.initUser` that initializes the frontend remult with the user based on the backend
- Fixed issue with dual call to initRequest in some cases

## [0.27.16] 2024-09-21

- Added support for `customFilter` defined in base classes

## [0.27.14] 2024-09-20

- A few tweaks by @jycouet in https://github.com/remult/remult/pull/515
- migrate to remult kit by @Yedidyar in https://github.com/remult/remult/pull/519

## [0.27.13] 2024-09-16

- fixed issue with null first and group by
- fixed an error where from json returned a row that didn't have an id and could cause problems
- fixed double init request in cases where `withRemult` accidentally wraps remult server

## [0.27.12] 2024-09-05

- added `$not` to value comparison: `{where:{id:{ $not:1 }}}}` for improved readability
- removed `group` option from `aggregate`
- Added unique id validations to all databases
- Verified that all databases add missing columns on `ensureSchema`
- Removed the deprecated behavior where if no entities array was sent to remult server, all entities were served
- Removed the deprecated web sql data provider, since no browsers support it - us the OpfsEntityDataProvider instead
- Changed id signature in EntityOptions to also allow `id:'code'` & `id:['company','code']` for compound id columns
- Fix to remult admin

## [0.27.11] 2024-09-04

- **Potential breaking change** change the http status code of exceptions thrown in backend method from 500 to 400

## [0.27.10] 2024-09-03

- Fix for minor typing issue regarding field | null | undefined

## [0.27.9] 2024-09-02

- Fix for minor issue in knex

## [0.27.8] 2024-09-02

- More great improvements to remult admin by [jycouet](https://github.com/jycouet)
- Added `groupBy` & `aggregate` to `Repository`
  ```ts
  repo(Employee).groupBy({
    group: ['country', 'city'],
    sum: ['salary'],
    where: {
      salary: {
        $gt: 2000,
      },
    },
  })
  ```
  [Checkout this example video](https://youtu.be/D5lDaulNDC4)

## [0.27.6] 2024-08-28

- Improvement to remult admin + support for bearer token in admin
- Fix to recursive sql expression
- Added support for backend method without a transaction using `transactional:false`
- Fixed live query, to update the subscribers asynchronously

## [0.27.5] 2024-08-23

- [#474](https://github.com/remult/remult/issues/474) When using knex, an id column with auto-increment that is not named id in the db gave an error

## [0.27.3] 2024-08-14

- Changed RelationOptions to be an extendable interface and not a type

## [0.27.2] 2024-08-07

- Added `request` to `remult.context` that'll be available through the request lifecycle - to access it please extend the RemultContext type as follows
  ```ts
  import type express from 'express'
  declare module 'remult' {
    export interface RemultContext {
      request?: express.Request
    }
  }
  ```

## [0.27.0] 2024-08-01

### API BREAKING CHANGE - Improved Typescript typing

Typescript version 5.4 included many changes that cause unknown & any to behave differently breaking existing code for some project.

In this version we reviewed the external api and made sure that it matches TS 5.4 while still supporting older version of TS (4.6)

Theses change are likely to cause build errors in existing projects, but in most cases these errors represent potential bugs that should be addressed.
Here's the list of significant changes:

- `findFirst`, `findOne` and `findId` can return `undefined` when the row is not found, if you're sure that the row exists, add a `!` after it, for example:
  ```ts
  let p = await repo(Person).findId(7) // p will be Person | undefined in the new version
  let q = (await repo(Person).findId(7))! // p will be Person
  ```
- Decorators that use entity, now require to define the entity in the generic definition.
  Previously you could have the following code:
  ```ts
  @Fields.string({
    validate: task => task.title.length > 2
  })
  title=''
  ```
  Now, that code will return an error that `title` is not a member of `unknown`. To fix that add the `Entity` generic definition:
  ```ts
  @Fields.string<Task>({
    validate: task => task.title.length > 2
    title = ''
  })
  ```
- `FieldMetadata.key` was changed from `string` to `keyof entityType` making it easier to traverse the object.
- `error` in `EntityRef`, `FieldRef` and `ControllerRef` can be `undefined` when there is no error
- Change `= any` to `= unknown` in most generic definitions

## [0.26.23] 2024-07-30

- Fixes and improvements to the admin panel

## [0.26.22] 2024-07-19

- fixed issue with prevent default and insert

## [0.26.21] 2024-07-11

- Fixed a bug with startsWith and endsWith worked like contains

## [0.26.20] 2024-07-10

- Added support for $not, $startsWith & $endsWith

## [0.26.19] 2024-07-08

- Fixed issue with recursive sqlExpression call for field

## [0.26.18] 2024-07-07

- Fixed an issue with sqlExpression without aliases - now remult automatically adds an alias in select, but not in order by or where.

## [0.26.17] 2024-07-06

- Added support for DuckDB

## [0.26.16] 2024-07-04

- Many improvements to `remult-admin`
- HUGE thanks to [jycouet](https://github.com/jycouet) & [celikovic](https://github.com/celikovic) for their amazing work on `remult-admin`

## [0.26.15] 2024-06-28

- docs - svelte tuto improvement by @jycouet in #458
- Fix #460

## [0.26.14] 2024-06-18

- Fixed typescript error with KnexDataProvider
- fixed issue where migrate didn't work in commonjs
- Bump mysql2 from 3.9.7 to 3.9.8 by @dependabot in #445
- fix auth.ts import for Next.js tutorial by @LegitPanda in #446
- Update example-apps.md by @ikx94 in #447
- Bump @azure/msal-node and tedious by @dependabot in #450
- Bump braces from 3.0.2 to 3.0.3 by @dependabot in #449
- Bump braces from 3.0.2 to 3.0.3 in /examples/angular-todo-fastify by @dependabot in #451
- docs: improve swagger-ui integration guide page with nextjs specific info by @kckusal in #448

### New Contributors

- @LegitPanda made their first contribution in #446
- @ikx94 made their first contribution in #447
- @kckusal made their first contribution in #448

## [0.26.13] 2024-05-22

- fix validators with args type-check error in ts 5.4

## [0.26.12] 2024-05-16

- Fixed an issue with stack overflow when calling `withRemult` from within `getUser` - relevant to next auth - `session` hook
- The "static" `withRemult` will now use the dataProvider provided in the remultServer options by default
- The "static" `withRemult` now supports promise of data provider etc...
- Changed json storage to save json in a non formatted way (condensed), and added a `formatted` option to control it. By default JsonFile storage is `formatted`
- Improved error handling in request lifecycle

## [0.26.11] 2024-05-13

- Fixed error in sqlite with reserved column names such as order etc...
- #427 - Changed the retry on error 500, to 4 times instead of 50 or infinite that was before.
- **Potential breaking change** #426 - Fixed to not trigger all relations to one load before saving and around read write json
- Fixed error when id was not found in ArrayEntityDataProvider to include the entity name
- Fixed filterToRaw to use the current database `wrapIdentifier` when none is provided.
- Fixed endless retry on error 500 - now it'll retry 4 times 500ms apart.
- Fixed error when sql expression sometimes translated wrongfully to a recursion error
- Added support for [Turso](https://turso.tech/) db

## [0.26.10] 2024-05-02

- Fix order by error with multiple id columns

## [0.26.8] 2024-05-01

- Added support for `sqlite3` that runs on stackblitz
- Fixed issues with knex when id columns are being updated
- Fixed issues with mongo when id columns are being updated

## [0.26.7] 2024-05-01

- Fixed issue with id being empty in some cases in the saved hook
- Added `describeEntity` and `describeBackendMethods` for better decorator-less support

## [0.26.6] 2024-04-29

- Minor fix to async_hooks fallback for running on stackblitz

## [0.26.5] 2024-04-28

- **Breaking change** - changed the api of `updateMany` to receive a `set` option, instead of second parameter for the set
- Fixed primary key was not created for entities that had more than one id column using knex or postgres
- Fixed issue where `dbNamesOf` in entity `sqlExpression` did not work

## [0.26.4] 2024-04-24

- `getValueList` now supports `@Fields.literal` & `@Fields.enum` (on top of `ValueListType`)

## [0.26.3] 2024-04-22

- Fixed issue with delete on Hono with session middleware
- Fixed an issue with admin not working with Hono@4.2

## [0.26.2] 2024-04-21

- Added support for SolidStart https://remult.dev/tutorials/solid-start/

## [0.26.1] 2024-04-18

- Fixed issue where 404 return an error - forbidden instead of not found
- Fixed an issue where `preventDefault` in `deleting` did not work

## [0.26.0] 2024-04-08

## Features

- Added support for migrations. See [Migrations](https://remult.dev/docs/migrations.html).
- Added an `error` hook to `RemultServerOptions` that is called whenever there is an error in the API lifecycle. See [RemultServerOptions](https://remult.dev/docs/ref_remultserveroptions.html#error).
- Added `ForbiddenError` to the API, you can throw it anywhere in the request lifecycle to display a forbidden 401 error.
- Added [`@Fields.literal`](https://remult.dev/docs/field-types.html#literal-fields-union-of-string-values) and [`@Fields.enum`](https://remult.dev/docs/field-types.html#enum-field).
- Added support for `better-sqlite3` without knex, see [Connection a Database](https://remult.dev/docs/quickstart.html#connecting-a-database).
- Added support for `bun:sqlite` [#387](https://github.com/remult/remult/issues/387#issuecomment-2030070423).
- Added a generic implementation for `sqlite` that can be easily extended to any provider.
- Added `apiPreprocessFilter` and `backendPreprocessFilter`, see [access control](https://remult.dev/docs/access-control.html#preprocessing-filters-for-api-requests).
- Added a way to analyze filter and query it - `Filter.getPreciseValues`, which returns a `FilterPreciseValues` object containing the precise values for each property. see [access control](https://remult.dev/docs/access-control.html#preprocessing-filters-for-api-requests).
- Added an exception when calling `updateMany` or `deleteMany` without a filter - to protect against accidental deleting/updating all data.
- Added updateMany and deleteMany to OpenAPI (swagger) & graphql

## Improvements

- Added validation for `@Fields.number` & `Fields.integer` that the value is a valid number.
- Added "basic" supports for environments where async hooks doesn't work well - mostly for web based dev machines.
- Improved the API of `rawFilter` so it can now return the SQL where to be added to the command. see [Leveraging Custom Filters for Enhanced Data Filtering](https://remult.dev/docs/custom-filter.html#leveraging-database-capabilities-with-raw-sql-in-custom-filters)
- `KnexDataProvider` now supports all `execute` and `createCommand` and can be used with any `SqlDatabase` functionality.
- Changed postgres schema builder to use `timestamptz` instead of `timestamp`.
- Changed the default storage of `@Fields.object` to `text` (varchar max) instead of string 255 in `knex` and `sqlite`.

## Documentation Updates

- Added or rewrote the following articles:
  - [Migrations](https://remult.dev/docs/migrations.html)
  - [Access Control](https://remult.dev/docs/access-control.html)
  - [Custom/SQL Filter](https://remult.dev/docs/custom-filter.html)
  - [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server.html)
  - [Extensibility](https://remult.dev/docs/custom-options.html)
  - Lots of `jsdocs` improvements

## Bug Fixes

- Fixed an issue with entity ids that included date.
- Fixed an issue with `repo(Entity,dataProvider)` - where saving wasn't fired because of wrong `isProxy` inference.
- Fixed an issue with chaining of validators that in some cases caused a validator to be overwritten.
- Fixed `ValueConverters` `Number` `fromInput` handle 0 as a valid value.

## Breaking Changes

- Changed the signature of `updateMany` and `deleteMany` to require a `where` parameter: `repo(Task).delete({ where: { completed: true } })`.
- Changed the signature of `getDb` to receive `DataProvider` as a parameter instead of `Remult`.
- Changed the POST REST API queries to include the filter under the `where` key in the body - previously, it included the filter as the body itself.

## New Contributors

- @eylonshm made their first contribution in https://github.com/remult/remult/pull/376
- @daan-vdv made their first contribution in https://github.com/remult/remult/pull/397

## [0.25.8] 2024-04-05

- Fixed issue with typing when `skipLibCheck: false`

## [0.25.7] 2024-03-21

- Fixed typing issue with validators and typescript 5.4
- Added `deleteMany` and `updateMany`
- When `insert` is called in the front-end with an array of items, a single POST call is made to the server
- Renamed `addParameterAndReturnSqlToken` to `param`. `addParameterAndReturnSqlToken` will be deprecated in future versions
- Default number storage in knex, previously was decimal(8,2) now, decimal(18,2)
- Fixed issue where exception throws in `initRequest` or `getUser` caused server to crash, instead of return a bad request error
- Changed required to allow 0 as a value - so only null, undefined and empty strings are considered invalid for a required field
- Fixed an issue where `backendPrefilter` was not applied to id based `update`, `save` or `delete` in the backend

## [0.25.6] 2024-03-17

- Added support for `orderByNullsFirst` in `PostgresDataProvider` to change the default postgres behavior where nulls are last
- Added support for `tableName` option argument for `dbNamesOf` that'll add the table name to each field
  Before:
  ```ts
  const orders = await dbNamesOf(Order)
  return `(select count(*) from ${orders} where ${orders}.${orders.id}=1)
  ```
  Now:
  ```ts
  const orders = await dbNamesOf(Order, { tableNames:true })
  return `(select count(*) from ${orders} where ${orders.id}=1)
  ```
- improved dbNamesOf of to use by default the wrapIdentifier of the current data provider if no wrap identifier was provided
- Added support for using dbNamesOf in an sql expression for that same entity
- Improved performance of dbNamesOf
- Added support for [Hono](https://hono.dev/) web framework
- Improved support for Mono repo scenario [#355](https://github.com/remult/remult/issues/355)
- Added `withRemult` to next js page router
- Fixed custom message to some validators (in etc...)
- Improved support for union string fields

## [0.25.5] 2024-02-11

- Added `admin` option to servers, enabling the `/api/admin` route with a built in entity explorer
- Fixed multiple issues with GraphQL and relations
- Improved support for esm/cjs in same process scenario
- Enabled json storage type for mysql & mysql2 knex adapters
- Fixed issue in case of missing `reflect-metadata`
- Added a recommended way to use remult in `sveltekit` using `api/[...remult]/+server.ts` route instead of a hook
- Added ArrayEntityDataProvider to the external api

## [0.25.4] 2024-01-15

- Fixed issue where a new row that was saved, changed again and saved again - provide wrong `isNew:true` value for field validate

## [0.25.3] 2024-01-15

- Fixed [#320](https://github.com/remult/remult/issues/320), dbReadonly columns are not created in the db

## [0.25.2] 2024-01-12

- Fix the `defaultMessage` of validators
- Added Validators.minLength

## [0.25.1] 2024-01-11

- Fixed issue where `defaultGetLimit` caused issues with include queries

## [0.25.0] 2024-01-10

### Improvement for validators

- Added `required` as a `FieldOption`
- Added validation for `maxLength` in `StringFieldOptions`
- Added the following validators to the `Validators` class:
  - regex
  - email
  - url
  - in
  - notNull
  - enum
  - relationExists,
  - maxLength
- Added support for return value for validations - true || undefined are valid, string will provide the message. For example:
  ```ts
  @Fields.string({
    validate:(task)=> task.title.length > 5 || "too short"
  })
  ```
- Added the `valueValidator` helper function:
  ```ts
  @Fields.string({
    validate: valueValidator(value => value.length > 5)
  })
  ```
- Added helper functions to create validators, `createValueValidator`, `createValueValidatorWithArgs`, `createValidator` & `createValidatorWithArgs`
- Changed signature of `FieldOptions`.`validate` the receive `ValidateFieldEvent` object as the second parameter instead of `FieldRef`
- Updated Signature of `required` and `unique` based on api change
- Adjusted the `unique` validator to only run on the backend

### New Frontend Data Providers

- Added Origin Private File System Storage to store entities in the front end
  ```ts
  const db = new JsonDataProvider(new JsonEntityOpfsStorage())
  repo(Task, db)
    .find()
    .then((tasks) => console.table(tasks))
  ```
- Added `SqlJsDataProvider` for use with front end sqlite implementation [sql.js](https://sql.js.org/)
  ```ts
  const db = new SqlDatabase(
    new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())),
  )
  repo(Task, db)
    .find()
    .then((tasks) => console.table(tasks))
  ```

### Other

- Added `clone` to `EntityRef`
- Fixed issue where `findOne` didn't work
- Fixed issue where exception `XXX is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?` was thrown in cases where multiple instances of remult were in memory
- Issue [#314](https://github.com/remult/remult/issues/314) resolved by @itamardavidyan in https://github.com/remult/remult/pull/315

## [0.24.1] 2023-12-30

- Improved JsonDataProvider to support promise for load and save, useful in all sorts of cases
- Fixed issue with ESM on NodeJS - Module '"remult/postgres"' has no exported member 'createPostgresDataProvider'.

## [0.24.0] 2023-12-29

### Changed

- **BREAKING CHANGE: PostgresDataProvider:** Column & table names are now quoted (e.g., `"firstName"`) to enforce specific casing in PostgreSQL.
  - To revert to the old (version < 0.24) case-insensitive identifiers, set `caseInsensitiveIdentifiers: true` when using `createPostgresDataProvider`.

### Added

- ESM support for NodeJS
- Support for [nuxt](https://nuxt.com/) Fullstack framework
- Support for the `sqlExpression` field option in entities using the `knex` data provider.
- `schema` parameter to `PostgresDataProvider` & `createPostgresDataProvider`.
- `findOne` method in `Repository` with a unified `options` parameter for simplicity.
- `withRemultAsync` function in `remultExpress` for contexts outside the normal request lifecycle.
- `withRemult` function for obtaining a valid remult context in server scenarios.
- Inclusion of `EntityMetadata` in `CaptionTransformer.transformCaption` method.
- `dbName` attribute in `EntityMetadata` & `FieldMetadata`.
- `wrapIdentifier` optional parameter in `dbNamesOf` function.
- `dbNames` as an optional parameter in the `filterToRaw` method of `SqlDatabase`.
- `wrapIdentifier` method in `SqlDatabase` for wrapping identifiers before sending to the database.

### Deprecated

- `getDbName` method in `EntityMetadata` & `FieldMetadata` (to be removed in future versions).

### Removed

- `run` method from `Remult`.

### Renamed

- `withRemultPromise` to `withRemultAsync` in `RemultServer`.

## [0.23.6] 2023-12-26

- Fixed issue where delete by id on the backend, didn't go through the deleting hook

## [0.23.5] 2023-12-23

- Fixed `toOne` relation filter null for non nullable fields to work
- Fixed `toOne` relation filter on $id:0 failed to work
- Fixed wrongful loading of `toMany` relation on api with `defaultIncluded`

## [0.23.4] 2023-12-20

- Fixed Live query to also work in init api [#306](https://github.com/remult/remult/issues/306)

## [0.23.3] 2023-12-19

- Added support for notContains filter option

## [0.23.1] 2023-12-12

- Fixed case insensitivity in contains for mongo db

## [0.23.0] 2023-12-11

- Added Relations - see [Relations](https://remult.dev/docs/entity-relations.html)
- Added LifecycleEvent info for saving,saved,deleting,deleted - see [Entity Lifecycle Hooks](https://remult.dev/docs/lifecycle-hooks.html)
- Saving, Saved, Deleting, Deleted all run only on the backend now
- include in api now supports expressions that use the current row
  - Breaking change - instead of `if(repo.fields.name.includedInApi)` you now need `if(repo.fields.name.includedInApi(instance))`
- Changed the way an entity id is defined see [Entity id's doc](http://localhost:5173/docs/ref_entity.html#id)
  Example:

  ```ts
  @Entity<OrderDetails>("orderDetails", { id: { orderId: true, productCode: true } })
  ```

- added repo function which is A convenient shortcut function to quickly obtain a repository for a specific entity type in Remult.

  ```ts
  await repo(Task).find()
  ```

- Added support for (Hapi api server)[https://hapi.dev/]
- Fixed exception with toRawFilter
- Fixed json db to support db names
- Fixed issue with sort result after live query
- Fix issue with compound id on middleware based servers
- Added with remult for sveltekit for usage before the remult hook
- Fixed issue with requireId not respecting in statement #290
- `findId` was changed to no longer use cache by default

## [0.22.12] 2023-11-26

- [#297](https://github.com/remult/remult/issues/297) - Crash on ensure schema failure

## [0.22.11] 2023-11-23

- Improved support for Mongo `ObjectId` field type [#295](https://github.com/remult/remult/issues/295)

## [0.22.10] 2023-11-17

- Fixed issue with `repo.validate` without specifying fields

## [0.22.9] 2023-10-06

- Fixed issue with Entity Backend Method and fields with allow api false #255

## [0.22.8] 2023-09-27

- Fixed an issue with rest call that had both and & or
- Fixed an issue regarding the usage of ManyToOne fields as part of the id

## [0.22.7] - 2023-09-05

- Fixed max stack reached in case of reference to self
- Improved graphql one to many relations
- Fixed live-query issue with complex filters
- Refactored tests to use vitest, and latest typescript version
- Fixed issue with postgres schema builder
- Fixed schema build to support table name with schema name
- Cleaned up code and removed angular dependency

## [0.22.6] - 2023-08-10

- Implemented $contains for mongo
- Implemented contains for graphql

## [0.22.5] - 2023-08-09

- Fixed issue [#220](https://github.com/remult/remult/issues/220)

## [0.22.4] - 2023-08-03

- Fixed an issue where an update with only a few fields, would update all other fields to their default values.

## [0.22.3] - 2023-08-02

- Fixed an issue with the many-to-one relation where the 'many' table did not store the ID as a `string` in cases where the 'one' table's ID column was not an integer
- Added tests for MariaDB and fixed issues

## [0.22.2] - 2023-07-30

- Fixed [#216](https://github.com/remult/remult/issues/216) wrong date type saved on update

## [0.22.1] - 2023-07-25

- Fixed issue [#215](https://github.com/remult/remult/issues/215) support for mongo without transactions

## [0.22.0] - 2023-07-16

- Added `ToJson` and `FromJson` methods the the `Repository` object. These are extremely useful in the context of SSR (next etc...) where you need to send plain json over the wire, but still want to have dates and other cool stuff in your app
- Fixed an issue with the many-to-one relation where the 'many' table did not store the ID as an 'integer' in cases where the 'one' table's ID column was an integer
- Fixed issue where using displayValue or validate on a spread object, marked it as new, and always triggered a post call
- Added Remult.run
- isBackend will return true or false based on dataProvider.isProxy equal false or runningOnServer member
- Backend method will call backend based on isBackend method,
- Replaced deprecated cuid with `paralleldrive/cuid2`
- Fixed an issue where when `getDb` was called without a `remult` parameter, it wouldn't use the default remult
- Fixed liveQuery's apply changes to also support state that it's initial value is undefined.
- Typescript 5 style decorators are now supported in development, but to deploy you still need `experimentalDecorators` .
  - Also, the decorators now do type checking, so if you put @Fields.string() on a number, it'll give you an error
  - And - no longer need for the Generics in the decorators setting.
    - `@Entity<Task>(...)` is now `@Entity(...)`
    - `@Fields.string<Task>(...)` is now `@Fields.string(...)`
  - Why didn't we implement typescript 5 decorators in runtime? the implementation for that is not yet fully supported with tools such as esbuild etc... so implementing it is trying to hit a moving target.
    At this time we recommend using `experimentalDecorator:false` for development, to get the typing, but `experimentalDecorator:true` for deploying and functionality.
- Added 404 on missing route for next app router - issue #211
- Fixed an issue where live query would not unsubscribe automatically to a query that failed to fetch.
- Fixed an issue where, when using the cache with findId or findFirst, and requesting to load fields, if the cache contained a row without those fields, it would return the cached row without those fields.
- Fixed an issue where in a filter that contained multiple instances of the same custom filter, with an 'and' condition did not work correctly
- Graphql Mutations now display validation errors in the graphql way

## [0.21.1] - 2023-06-25

- Fixed issue with `Field.Json` fails to insert in case of array

## [0.21.0] - 2023-06-22

- Major improvements to the GraphQL support:
  - Better Query support
  - Mutation Support
  - Improved compatibility to standard GraphQL structures
  - **Breaking Change** Note that the GraphQL Schema has changed, and client code needs to be adjusted. If you run into any issues, please open a github issue or reach out to us on discord.
- Improved SQL Log to Console see [PR #204](https://github.com/remult/remult/pull/204),

### Big Thanks

- to [jycouet](https://github.com/jycouet) for his first two pull requests, and his help forming the GraphQL Schema according to best practices.
- to [talmosko](https://github.com/talmosko) for his help and improvements for the tutorials and documentation.

## [0.20.6] - 2023-06-19

- Fixed an issue when apiPrefilter was an arrow function, it did not affect get of a specific resource

## [0.20.5] - 2023-06-11

- fixed issue #200 transactions on mongo db

## [0.20.4] - 2023-06-05

- fixed issue with columns in postgres with casing in the db - sa `createdAt`
- Issue #196 fixed - load options in live query
- Fixed issue with `apiReadAllowed:false` when `apiUpdateAllowed` is set to undefined

## [0.20.3] - 2023-05-23

- Improved Open API Support

## [0.20.2] - 2023-05-22

- createdAt & updatedAt are by default `allowApiUpdate` false
- Added `apiPrefix` to `BackendMethod` `options` to allow more control over backend method routes. #189

## [0.20.1] - 2023-05-17

- Improved support for compound id entity
- Minor bug fixes
- Improved memory usage

## [0.20.0] - 2023-05-08

- Added `handle` method for using remult in `next.js` api handlers. see [using remult in a next.js api handler](https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler)
- Added `remult-sveltekit` see [Add remult to your project](https://remult.dev/docs/add-remult-to-your-app.html#sveltekit)
- Added support for `next.js` App Router. See [Add remult to your project](https://remult.dev/docs/add-remult-to-your-app.html#next-js-app-router)

## [0.19.0] - 2023-03-26

- `Repository`
  - Added a `validate` method that returns an `ErrorInfo` object if invalid.
  - Added a `fields` member that can be used to access the metadata of specific fields, for example:
    ```ts
    repo.fields.title.caption
    //or
    repo.fields.title.inputType
    ```
  - The `insert`, `validate`, `create`, `save` and `update` value will now run `fromJson` and `toJson` for field values that do not match their type - for consistent behavior with the `api`
- `FieldMetadata`
  - Added `apiUpdateAllowed` to query if `update` is allowed for this field
  - Added `includedInApi` to query of this field would be returned from the backend as part of the api
  - Added `displayValue` that can be used to achieve a consistent way a field is displayed.
  - Added `toInput` and `fromInput` methods that'll help with translating values from and to inputs.
- `getId` method added to `IdMetadata` to enable extracting the id from immutable objects, this is mainly useful for entities where the `id` column is not called `id` :)
  ```ts
  repo.metadata.idMetadata.getId(task)
  ```
-

### Breaking Changes

- In `EntityMetadata` the `apiUpdateAllowed`, `apiDeleteAllowed` and `apiInsertAllowed` that previously were boolean fields, are now methods that accepts item and return true or false. This is useful for cases where the apiAllowed rules refer to the specific values of an entity.
  ```ts
  // Previously
  if (repo.metadata.apiDeleteAllowed) {
  }
  // Now
  if (repo.metadata.apiDeleteAllowed(task)) {
  }
  ```
- The `validate` method in `EntityRef` and `ControllerRef` that previously returned true if valid, now returns `undefined` if valid and `ErrorInfo` if invalid
- `FieldMetadata`'s `ValueConverter` field's members are now mandatory and no longer optional - it's expected that they'll be implemented
