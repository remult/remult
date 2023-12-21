# Relations
* **Relations**
## constructor
* **new Relations**
## toMany
Define a toMany relation between entities, indicating a one-to-many relationship.
This method allows you to establish a relationship where one entity can have multiple related entities.
   
   
   *returns*
   A decorator function to apply the toMany relation to an entity field.
   
   Example usage:
   ```
   @Relations.toMany(() => Order)
   orders?: Order[];
   
   // or with a custom field name:
   @Relations.toMany(() => Order, "customerId")
   orders?: Order[];
   ```

Arguments:
* **toEntityType**
* **fieldInToEntity** - (Optional) The field in the target entity that represents the relation.
                      Use this if you want to specify a custom field name for the relation.
## toOne
Define a to-one relation between entities, indicating a one-to-one relationship.
If no field or fields are provided, it will automatically create a field in the database
to represent the relation.
   
   
   *returns*
   A decorator function to apply the to-one relation to an entity field.
   
   Example usage:
   ```
   @Relations.toOne(() => Customer)
   customer?: Customer;
   ```

Arguments:
* **toEntityType**
* **options** - (Optional): An object containing options for configuring the to-one relation.
