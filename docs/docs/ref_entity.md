# Entity
Decorates classes that should be used as entities.
Receives a key and an array of EntityOptions.


#### example:
```ts
import  { Entity, Fields } from "remult";
@Entity("tasks", {
   allowApiCrud: true
})
export class Task {
   @Fields.id()
   id!: string;
   @Fields.string()
   title = '';
   @Fields.boolean()
   completed = false;
}
```
EntityOptions can be set in two ways:


#### example:
```ts
// as an object
@Entity("tasks",{ allowApiCrud:true })
```


#### example:
```ts
// as an arrow function that receives `remult` as a parameter
@Entity("tasks", (options,remult) => options.allowApiCrud = true)
```
## caption
A human readable name for the entity
## label
A human readable label for the entity. Can be used to achieve a consistent label for a field throughout the app


#### example:
```ts
<h1>Create a new item in {taskRepo.metadata.label}</h1>
```
## allowApiRead
Determines if this Entity is available for get requests using Rest Api


#### see:
 - [allowed](http://remult.dev/docs/allowed.html)
 - to restrict data based on a criteria, use [apiPrefilter](https://remult.dev/docs/ref_entity.html#apiprefilter)

## allowApiUpdate
Determines if this entity can be updated through the api.


#### see:
 - [allowed](http://remult.dev/docs/allowed.html)
 - [Access Control](https://remult.dev/docs/access-control)

## allowApiDelete
Determines if entries for this entity can be deleted through the api.


#### see:
 - [allowed](http://remult.dev/docs/allowed.html)
 - [Access Control](https://remult.dev/docs/access-control)

## allowApiInsert
Determines if new entries for this entity can be posted through the api.


#### see:
 - [allowed](http://remult.dev/docs/allowed.html)
 - [Access Control](https://remult.dev/docs/access-control)

## allowApiCrud
sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set
## apiPrefilter
An optional filter that determines which rows can be queried using the API.
This filter is applied to all CRUD operations to ensure that only authorized data is accessible.

Use `apiPrefilter` to restrict data based on user profile or other conditions.


#### example:
```ts
// Only include non-archived items in API responses
apiPrefilter: { archive: false }
```


#### example:
```ts
// Allow admins to access all rows, but restrict non-admins to non-archived items
apiPrefilter: () => remult.isAllowed("admin") ? {} : { archive: false }
```


#### see:
[EntityFilter](https://remult.dev/docs/access-control.html#filtering-accessible-rows)
## apiPreprocessFilter
An optional function that allows for preprocessing or modifying the EntityFilter for a specific entity type
before it is used in API CRUD operations. This function can be used to enforce additional access control
rules or adjust the filter based on the current context or specific request.


#### example:
```typescript
@Entity<Task>("tasks", {
  apiPreprocessFilter: async (filter, { getPreciseValues }) => {
    // Ensure that users can only query tasks for specific customers
    const preciseValues = await getPreciseValues();
    if (!preciseValues.customerId) {
      throw new ForbiddenError("You must specify a valid customerId filter");
    }
    return filter;
  }
})
```
## backendPreprocessFilter
Similar to apiPreprocessFilter, but for backend operations.
## backendPrefilter
A filter that will be used for all queries from this entity both from the API and from within the backend.


#### example:
```ts
backendPrefilter: { archive:false }
```


#### see:
[EntityFilter](http://remult.dev/docs/entityFilter.html)
## defaultOrderBy
An order by to be used, in case no order by was specified


#### example:
```ts
defaultOrderBy: { name: "asc" }
```


#### example:
```ts
defaultOrderBy: { price: "desc", name: "asc" }
```
## saving
An event that will be fired before the Entity will be saved to the database.
If the `error` property of the entity's ref or any of its fields will be set, the save will be aborted and an exception will be thrown.
this is the place to run logic that we want to run in any case before an entity is saved.


#### example:
```ts
@Entity<Task>("tasks", {
  saving: async (task, e) => {
    if (e.isNew) {
      task.createdAt = new Date(); // Set the creation date for new tasks.
    }
    task.lastUpdated = new Date(); // Update the last updated date.
  },
})
```


#### see:
[Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
## saved
A hook that runs after an entity has been successfully saved.


#### see:
[Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
## deleting
A hook that runs before an entity is deleted.


#### see:
[Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
## deleted
A hook that runs after an entity has been successfully deleted.


#### see:
[Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
## validation
A hook that runs to perform validation checks on an entity before saving.
This hook is also executed on the frontend.


#### see:
[Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
## dbName
The name of the table in the database that holds the data for this entity.
If no name is set, the `key` will be used instead.


#### example:
```ts
dbName:'myProducts'

You can also add your schema name to the table name
```


#### example:
```ts
dbName:'public."myProducts"'
```
## sqlExpression
For entities that are based on SQL expressions instead of a physical table or view


#### example:
```ts
@Entity('people', {
  sqlExpression:`select id,name from employees
                 union all select id,name from contractors`,
})
export class Person {
  @Fields.string()
  id=''
  @Fields.string()
  name=''
}
```
## id
An arrow function that identifies the `id` column to use for this entity


#### example:
```ts
//Single column id
@Entity<Products>("products", { id: 'productCode' })
```


#### example:
```ts
//Multiple columns id
@Entity<OrderDetails>("orderDetails", { id:['orderId:', 'productCode'] })
```
## entityRefInit

Arguments:
* **ref**
* **row**
## dataProvider
A function that allows customizing the data provider for the entity.


#### example:
```ts
dataProvider: (dp) => {
  if (!dp.isProxy) // usually indicates that we're on the backend
    return getASpacificDataProvider();
  return null
}
```
## apiRequireId
* **apiRequireId**
