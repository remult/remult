# Entity
## id
## dbAutoIncrementId
## key
A unique identifier that represents this entity, it'll also be used as the api route for this entity.
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
[allowed](http://remult.github.io/guide/allowed.html)
## allowApiUpdate
Determines if this entity can be updated through the api.
### see
[allowed](http://remult.github.io/guide/allowed.html)
## allowApiDelete
### see
[allowed](http://remult.github.io/guide/allowed.html)
## allowApiInsert
### see
[allowed](http://remult.github.io/guide/allowed.html)
## allowApiCrud
sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set
## apiDataFilter
A filter that determines which rows can be queries using the api.
## apiRequireId
## fixedFilter
A filter that will be used for all queries from this entity both from the API and from within the server.
### example
```ts
fixedWhereFilter: () => this.archive.isEqualTo(false)
```

## customFilterBuilder
## defaultOrderBy
An order by to be used, in case no order by was specified
### example
```ts
defaultOrderBy: () => this.name
```

### example
```ts
defaultOrderBy: () => [this.price, this.name]
```

### example
```ts
defaultOrderBy: () => [{ column: this.price, descending: true }, this.name]
```

## saving
An event that will be fired before the Entity will be saved to the database.
If the `validationError` property of the entity or any of it's columns will be set, the save will be aborted and an exception will be thrown.
this is the place to run logic that we want to run in any case before an entity is saved.
### example
```ts
saving: async () => {
  if (isBackend()) {
    if (this.isNew()) {
        this.createDate.value = new Date();
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
