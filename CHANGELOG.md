# Changelog

All notable changes to this project will be documented in this file.

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
