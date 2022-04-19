# Field
Decorates fields that should be used as fields.
for more info see: [Field Types](https://remult.dev/docs/field-types.html)
FieldOptions.
FieldOptions can be set in two ways:
### example
```ts
// as an object
@Fields.string({ includeInApi:false })
```

### example
```ts
// as an arrow function that receives `remult` as a parameter
@Fields.string((options,remult) => options.includeInApi = true)
```

## caption
A human readable name for the field
## allowNull
If it can store null in the database
## includeInApi
If this field data is included in the api.
### see
[allowed](http://remult.dev/docs/allowed.html)
## allowApiUpdate
If this field data can be updated in the api.
### see
[allowed](http://remult.dev/docs/allowed.html)
## validate
An arrow function that'll be used to perform validations on it
### example
```ts
@Fields.string({
  validate: Validators.required
})
```

### example
```ts
@Fields.string<Task>({
   validate: task=>{
     if (task.title.length<3)
         throw "Too Short";
  }
})
```

### example
```ts
@Fields.string({
   validate: (_, fieldRef)=>{
     if (fieldRef.value.length<3)
         fieldRef.error = "Too Short";
  }
})
```

## saving
## serverExpression
An expression that will determine this fields value on the backend and be provided to the front end
## dbName
The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.
## sqlExpression
Used or fields that are based on an sql expressions, instead of a physical table column
## dbReadOnly
For fields that shouldn't be part of an update or insert statement
## valueConverter
The value converter to be used when loading and saving this field
## displayValue
an arrow function that translates the value to a display value
## defaultValue
an arrow function that determines the default value of the field, when the entity is created using the `repo.create` method
## inputType
The html input type for this field
## lazy
Determines if the referenced entity will be loaded immediately or on demand.
### see[lazy
loading of related entities](http://remult.dev/docs/lazy-loading-of-related-entities.html)

## valueType
The value type for this field
## target
The entity type to which this field belongs
## key
The key to be used for this field
