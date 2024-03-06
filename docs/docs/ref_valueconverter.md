# ValueConverter
Interface for converting values between different formats, such as in-memory objects, database storage,
JSON data transfer objects (DTOs), and HTML input elements.
## fromJson
Converts a value from a JSON DTO to the valueType. This method is typically used when receiving data
from a REST API call or deserializing a JSON payload.
   
   
   *returns*
   The converted value.
   
   
   *example*
   ```ts
   fromJson: val => new Date(val)
   ```

Arguments:
* **val** - The value to convert.
## toJson
Converts a value of valueType to a JSON DTO. This method is typically used when sending data
to a REST API or serializing an object to a JSON payload.
   
   
   *returns*
   The converted value.
   
   
   *example*
   ```ts
   toJson: val => val?.toISOString()
   ```

Arguments:
* **val** - The value to convert.
## fromDb
Converts a value from the database format to the valueType.
   
   
   *returns*
   The converted value.
   
   
   *example*
   ```ts
   fromDb: val => new Date(val)
   ```

Arguments:
* **val** - The value to convert.
## toDb
Converts a value of valueType to the database format.
   
   
   *returns*
   The converted value.
   
   
   *example*
   ```ts
   toDb: val => val?.toISOString()
   ```

Arguments:
* **val** - The value to convert.
## toInput
Converts a value of valueType to a string suitable for an HTML input element.
   
   
   *returns*
   The converted value as a string.
   
   
   *example*
   ```ts
   toInput: (val, inputType) => val?.toISOString().substring(0, 10)
   ```

Arguments:
* **val** - The value to convert.
* **inputType** - The type of the input element (optional).
## fromInput
Converts a string from an HTML input element to the valueType.
   
   
   *returns*
   The converted value.
   
   
   *example*
   ```ts
   fromInput: (val, inputType) => new Date(val)
   ```

Arguments:
* **val** - The value to convert.
* **inputType** - The type of the input element (optional).
## displayValue
Returns a displayable string representation of a value of valueType.
   
   
   *returns*
   The displayable string.
   
   
   *example*
   ```ts
   displayValue: val => val?.toLocaleDateString()
   ```

Arguments:
* **val** - The value to convert.
## fieldTypeInDb
Specifies the storage type used in the database for this field.
   
   
   *example*
   ```ts
   readonly fieldTypeInDb = 'decimal(18,2)';
   ```
## inputType
Specifies the type of HTML input element suitable for values of valueType.
   
   
   *example*
   ```ts
   readonly inputType = 'date';
   ```
