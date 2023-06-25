# FieldMetadata
Metadata for a `Field`, this metadata can be used in the user interface to provide a richer UI experience
## allowNull
if null is allowed for this field
## caption
A human readable caption for the field. Can be used to achieve a consistent caption for a field throughout the app
   
   
   *example*
   ```ts
   <input placeholder={taskRepo.metadata.fields.title.caption}/>
   ```
   
## dbReadOnly
indicates that this field should only be included in select statement, and excluded from update or insert. useful for db generated ids etc...
## includedInApi
* **includedInApi**
## inputType
The `inputType` relevant for this field, determined by the options sent to it's decorator and the valueConverter in these options
## isServerExpression
Indicates if this field is based on a server express
## key
The field's member name in an object.
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   console.log(taskRepo.metadata.fields.title.key);
   // result: title
   ```
   
## options
The options sent to this field's decorator
## target
The class that contains this field
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   Task == taskRepo.metadata.fields.title.target //will return true
   ```
   
## valueConverter
the Value converter for this field
## valueType
The field's value type (number,string etc...)
## apiUpdateAllowed
* **apiUpdateAllowed**

Arguments:
* **item**
## displayValue
Get the display value for a specific item
   
   
   *example*
   ```ts
   repo.fields.createDate.displayValue(task) //will display the date as defined in the `displayValue` option defined for it.
   ```
   

Arguments:
* **item**
## fromInput
Adapts the value for usage with html input
   
   
   *example*
   ```ts
   @Fields.dateonly()
   birthDate = new Date(1976,5,16)
   //...
   person.birthDate = repo.fields.birthDate.fromInput(personFormState) // will return Date
   ```
   

Arguments:
* **inputValue**
* **inputType**
## getDbName
Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option
## toInput
Adapts the value for usage with html input
   
   
   *example*
   ```ts
   @Fields.dateonly()
   birthDate = new Date(1976,5,16)
   //...
   input.value = repo.fields.birthDate.toInput(person) // will return '1976-06-16'
   ```
   

Arguments:
* **value**
* **inputType**
