# Entity
## id
## dbAutoIncrementId
## dbName
The name of the table in the database that holds the data for this entity.
If no name is set, the `key` will be used instead.
### example
```ts
dbName:'myProducts'
```

## sqlExpression
## caption
A human readable name for the entity
## allowApiRead
Determines if this Entity is available for get requests using Rest Api
### see
[allowed](http://remult.dev/guide/allowed.html)
## allowApiUpdate
Determines if this entity can be updated through the api.
### see
[allowed](http://remult.dev/guide/allowed.html)
## allowApiDelete
### see
[allowed](http://remult.dev/guide/allowed.html)
## allowApiInsert
### see
[allowed](http://remult.dev/guide/allowed.html)
## allowApiCrud
sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set
## apiPrefilter
A filter that determines which rows can be queries using the api.
## apiRequireId
## backendPrefilter
A filter that will be used for all queries from this entity both from the API and from within the server.
### example
```ts
fixedWhereFilter: () => this.archive.isEqualTo(false)
```

## defaultOrderBy
An order by to be used, in case no order by was specified
### example
```ts
defaultOrderBy: { name: "asc" }
```

### example
```ts
defaultOrderBy: { price: "asc", name: "asc" }
```

### example
```ts
defaultOrderBy: { price: "desc", name: "asc" }
```

## saving
An event that will be fired before the Entity will be saved to the database.
If the `validationError` property of the entity or any of it's columns will be set, the save will be aborted and an exception will be thrown.
this is the place to run logic that we want to run in any case before an entity is saved.
### example
```ts
saving: async (self) => {
  if (isBackend()) {
    if (self.isNew()) {
        self.createDate.value = new Date();
    }
  }
}
```

## saved
will be called after the Entity was saved to the data source.
## deleting
Will be called before an Entity is deleted.
## deleted
Will be called after an Entity is deleted
## validation
