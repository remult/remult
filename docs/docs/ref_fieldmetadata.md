# FieldMetadata

Metadata for a `Field`, this metadata can be used in the user interface to provide a richer UI experience

## valueType

The field's value type (number,string etc...)

## key

The field's member name in an object.

#### example:

```ts
console.log(repo(Task).metadata.fields.title.key)
// result: title
```

## caption

A human readable caption for the field. Can be used to achieve a consistent caption for a field throughout the app

#### example:

```ts
<input placeholder={taskRepo.metadata.fields.title.caption}/>
```

#### see:

[FieldOptions#caption](/docs/ref_field#caption) for configuration details

## label

A human readable label for the field. Can be used to achieve a consistent label for a field throughout the app

#### example:

```ts
<input placeholder={taskRepo.metadata.fields.title.label}/>
```

#### see:

[FieldOptions.label](/docs/ref_field#label) for configuration details

## dbName

The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.

#### example:

```ts
@Fields.string({ dbName: 'userName'})
userName=''
```

#### see:

[FieldOptions#dbName](/docs/ref_field#dbname) for configuration details

## options

The options sent to this field's decorator

## inputType

The `inputType` relevant for this field, determined by the options sent to it's decorator and the valueConverter in these options

## allowNull

if null is allowed for this field

#### see:

[FieldOptions#allowNull](/docs/ref_field#allownull) for configuration details

## target

The class that contains this field

#### example:

```ts
Task == repo(Task).metadata.fields.title.target //will return true
```

## getDbName

- **getDbName**

## isServerExpression

Indicates if this field is based on a server express

## dbReadOnly

indicates that this field should only be included in select statement, and excluded from update or insert. useful for db generated ids etc...

#### see:

[FieldOptions#dbReadOnly](/docs/ref_field#dbreadonly) for configuration details

## valueConverter

the Value converter for this field

## displayValue

Get the display value for a specific item

#### see:

[FieldOptions#displayValue](/docs/ref_field#displayvalue) for configuration details

#### example:

```ts
repo.fields.createDate.displayValue(task) //will display the date as defined in the `displayValue` option defined for it.
```

Arguments:

- **item**

## apiUpdateAllowed

Determines if the current user is allowed to update a specific entity instance.

#### example:

```ts
// Check if the current user is allowed to update a specific task
if (repo(Task).metadata.apiUpdateAllowed(task)) {
  // Allow user to edit the entity
}
```

#### see:

[FieldOptions#allowApiUpdate](/docs/ref_field#allowapiupdate) for configuration details

#### returns:

True if the update is allowed.

Arguments:

- **item** - Partial entity instance to check permissions against.

## includedInApi

Determines if a specific entity field should be included in the API based on the current user's permissions.
This method checks visibility permissions for a field within a partial entity instance.

#### example:

```ts
const employeeRepo = remult.repo(Employee)
// Determine if the 'salary' field of an employee should be visible in the API for the current user
if (employeeRepo.fields.salary.includedInApi({ id: 123, name: 'John Doe' })) {
  // The salary field is included in the API
}
```

#### see:

[FieldOptions#includeInApi](/docs/ref_field#includeinapi) for configuration details

#### returns:

True if the field is included in the API.

Arguments:

- **item** - The partial entity instance used to evaluate field visibility.

## toInput

Adapts the value for usage with html input

#### example:

```ts
@Fields.dateOnly()
birthDate = new Date(1976,5,16)
//...
input.value = repo.fields.birthDate.toInput(person) // will return '1976-06-16'
```

#### see:

[ValueConverter#toInput](/docs/ref_valueconverter#toinput) for configuration details

Arguments:

- **value**
- **inputType**

## fromInput

Adapts the value for usage with html input

#### example:

```ts
@Fields.dateOnly()
birthDate = new Date(1976,5,16)
//...
person.birthDate = repo.fields.birthDate.fromInput(personFormState) // will return Date
```

#### see:

[ValueConverter#fromInput](/docs/ref_valueconverter#frominput) for configuration details

Arguments:

- **inputValue**
- **inputType**
