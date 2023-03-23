# Release Notes

## Next version

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
-
