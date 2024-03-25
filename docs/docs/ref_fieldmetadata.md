# FieldMetadata
Metadata for a `Field`, this metadata can be used in the user interface to provide a richer UI experience
## valueType
The field's value type (number,string etc...)
## key
The field's member name in an object.
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   console.log(taskRepo.metadata.fields.title.key);
   // result: title
   ```
## caption
A human readable caption for the field. Can be used to achieve a consistent caption for a field throughout the app
   
   
   #### example:
   ```ts
   <input placeholder={taskRepo.metadata.fields.title.caption}/>
   ```
## dbName
The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.
   
   
   #### example:
   ```ts
   @Fields.string({ dbName: 'userName'})
   userName=''
   ```
## options
The options sent to this field's decorator
## inputType
The `inputType` relevant for this field, determined by the options sent to it's decorator and the valueConverter in these options
## allowNull
if null is allowed for this field
## target
The class that contains this field
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   Task == taskRepo.metadata.fields.title.target //will return true
   ```
## getDbName
* **getDbName**
## isServerExpression
Indicates if this field is based on a server express
## dbReadOnly
indicates that this field should only be included in select statement, and excluded from update or insert. useful for db generated ids etc...
## valueConverter
the Value converter for this field
## displayValue
Get the display value for a specific item
   
   
   #### example:
   ```ts
   repo.fields.createDate.displayValue(task) //will display the date as defined in the `displayValue` option defined for it.
   ```

Arguments:
* **item**
## apiUpdateAllowed
* **apiUpdateAllowed**

Arguments:
* **item**
## includedInApi
* **includedInApi**

Arguments:
* **item**
## toInput
Adapts the value for usage with html input
   
   
   #### example:
   ```ts
   @Fields.dateOnly()
   birthDate = new Date(1976,5,16)
   //...
   input.value = repo.fields.birthDate.toInput(person) // will return '1976-06-16'
   ```

Arguments:
* **value**
* **inputType**
## fromInput
Adapts the value for usage with html input
   
   
   #### example:
   ```ts
   @Fields.dateOnly()
   birthDate = new Date(1976,5,16)
   //...
   person.birthDate = repo.fields.birthDate.fromInput(personFormState) // will return Date
   ```

Arguments:
* **inputValue**
* **inputType**
