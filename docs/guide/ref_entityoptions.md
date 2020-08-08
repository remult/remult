# EntityOptions
## allowApiCRUD
sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set
## allowApiDelete
### see
[allowed](http://remult-ts.github.io/guide/allowed.html)
## allowApiInsert
### see
[allowed](http://remult-ts.github.io/guide/allowed.html)
## allowApiRead
Determines if this Entity is available for get requests using Rest Api
### see
[allowed](http://remult-ts.github.io/guide/allowed.html)
## allowApiUpdate
### see
[allowed](http://remult-ts.github.io/guide/allowed.html)
## apiDataFilter
A filter that determines which rows can be queries using the api.
### example
```ts
apiDataFilter: () => {
  if (!context.isSignedIn())
     return this.availableTo.isGreaterOrEqualTo(new Date());
  }
```

## caption
A human readable name for the entity
## dbName
The name of the table in the database that holds the data for this entity.
If no name is set, the `name` will be used instead.
### example
```ts
dbName = 'myProducts'
```

### example
```ts
dbName = () => 'select distinct name from Products`
```

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

## deleted
Will be called after an Entity is deleted
## deleting
Will be called before an Entity is deleted.
## fixedWhereFilter
A filter that will be used for all queries from this entity both from the API and from within the server.
### example
```ts
fixedWhereFilter: () => this.archive.isEqualTo(false)
```

## name
### description

A unique identifier that represents this entity, it'll also be used as the api route for this entity.
### publicapi


## saved
will be called after the Entity was saved to the data source.
## saving
An event that will be fired before the Entity will be saved to the database.
If the `validationError` property of the entity or any of it's columns will be set, the save will be aborted and an exception will be thrown.
this is the place to run logic that we want to run in any case before an entity is saved.
### example
```ts
saving: async () => {
  if (context.onServer) {
    if (this.isNew()) {
        this.createDate.value = new Date();
    }
  }
}
```

## validation
