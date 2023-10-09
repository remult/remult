# Entity
Decorates classes that should be used as entities.
Receives a key and an array of EntityOptions.
   
   
   *example*
   ```ts
   import  { Entity, Fields } from "remult";
   @Entity("tasks", {
      allowApiCrud: true
   })
   export class Task {
      @Fields.uuid()
      id!: string;
      @Fields.string()
      title = '';
      @Fields.boolean()
      completed = false;
   }
   ```
   
   
   *note*
   EntityOptions can be set in two ways:
   
   
   *example*
   ```ts
   // as an object
   @Entity("tasks",{ allowApiCrud:true })
   ```
   
   
   *example*
   ```ts
   // as an arrow function that receives `remult` as a parameter
   @Entity("tasks", (options,remult) => options.allowApiCrud = true)
   ```
## caption
A human readable name for the entity
## allowApiRead
Determines if this Entity is available for get requests using Rest Api
   
   
   *description*
   Determines if one has any access to the data of an entity.
   
   
   *see*
    - [allowed](http://remult.dev/docs/allowed.html)
    - to restrict data based on a criteria, use [apiPrefilter](https://remult.dev/docs/ref_entity.html#apiprefilter)
   
## allowApiUpdate
Determines if this entity can be updated through the api.
   
   
   *see*
   [allowed](http://remult.dev/docs/allowed.html)
## allowApiDelete
Determines if entries for this entity can be deleted through the api.
   
   
   *see*
   [allowed](http://remult.dev/docs/allowed.html)
## allowApiInsert
Determines if new entries for this entity can be posted through the api.
   
   
   *see*
   [allowed](http://remult.dev/docs/allowed.html)
## allowApiCrud
sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set
## apiPrefilter
A filter that determines which rows can be queries using the api.
   
   
   *description*
   Use apiPrefilter in cases where you to restrict data based on user profile
   
   
   *example*
   ```ts
   apiPrefilter: { archive:false }
   ```
   
   
   *example*
   ```ts
   apiPrefilter: ()=> remult.isAllowed("admin")?{}:{ archive:false }
   ```
   
   
   *see*
   [EntityFilter](http://remult.dev/docs/entityFilter.html)
## backendPrefilter
A filter that will be used for all queries from this entity both from the API and from within the backend.
   
   
   *example*
   ```ts
   backendPrefilter: { archive:false }
   ```
   
   
   *see*
   [EntityFilter](http://remult.dev/docs/entityFilter.html)
## defaultOrderBy
An order by to be used, in case no order by was specified
   
   
   *example*
   ```ts
   defaultOrderBy: { name: "asc" }
   ```
   
   
   *example*
   ```ts
   defaultOrderBy: { price: "desc", name: "asc" }
   ```
## saving
An event that will be fired before the Entity will be saved to the database.
If the `error` property of the entity's ref or any of its fields will be set, the save will be aborted and an exception will be thrown.
this is the place to run logic that we want to run in any case before an entity is saved.
   
   
   *example*
   ```ts
   @Entity<Task>("tasks", {
   saving: async task => {
        task.lastUpdated = new Date()
    }
   })
   ```

Arguments:
* **row**
* **e**
## saved
will be called after the Entity was saved to the data source.

Arguments:
* **row**
* **e**
## deleting
Will be called before an Entity is deleted.

Arguments:
* **row**
* **e**
## deleted
Will be called after an Entity is deleted

Arguments:
* **row**
* **e**
## validation
Will be called when the entity is being validated, usually prior to the `saving` event

Arguments:
* **row**
* **ref**
## dbName
The name of the table in the database that holds the data for this entity.
If no name is set, the `key` will be used instead.
   
   
   *example*
   ```ts
   dbName:'myProducts'
   
   You can also add your schema name to the table name
   ```
   
   
   *example*
   ```ts
   dbName:'public."myProducts"'
   ```
## sqlExpression
For entities that are based on SQL expressions instead of a physical table or view
## id
An arrow function that identifies the `id` column to use for this entity
   
   
   *example*
   ```ts
   //Single column id
   @Entity<Products>("products", { id:p=>p.productCode })
   ```
   
   
   *example*
   ```ts
   //Multiple columns id
   @Entity<OrderDetails>("orderDetails", { id:od=> [od.orderId, od.productCode] })
   ```
## entityRefInit

Arguments:
* **ref**
* **row**
## apiRequireId
* **apiRequireId**
