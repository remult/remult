# Remult
* **Remult**
## repo
Return's a `Repository` of the specific entity type


#### example:
```ts
const taskRepo = remult.repo(Task);
```


#### see:
[Repository](https://remult.dev/docs/ref_repository.html)

Arguments:
* **entity** - the entity to use
* **dataProvider** - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
## subscribeAuth
* **subscribeAuth**

Arguments:
* **listener**
## initUser
Fetches user information from the backend and updates the `remult.user` object.
Typically used during application initialization and user authentication.


#### returns:
A promise that resolves to the user's information or `undefined` if unavailable.
## authenticated
Checks if a user was authenticated
## isAllowed
checks if the user has any of the roles specified in the parameters


#### example:
```ts
remult.isAllowed("admin")
```


#### see:
[Allowed](https://remult.dev/docs/allowed.html)

Arguments:
* **roles**
## isAllowedForInstance
checks if the user matches the allowedForInstance callback


#### see:
[Allowed](https://remult.dev/docs/allowed.html)

Arguments:
* **instance**
* **allowed**
## useFetch
* **useFetch**

Arguments:
* **fetch**
## dataProvider
The current data provider
## constructor
Creates a new instance of the `remult` object.

Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.

If no provider is specified, `fetch` will be used as an http provider

Arguments:
* **http**
## call
Used to call a `backendMethod` using a specific `remult` object


#### example:
```ts
await remult.call(TasksController.setAll, undefined, true);
```

Arguments:
* **backendMethod** - the backend method to call
* **classInstance** - the class instance of the backend method, for static backend methods use undefined
* **args** - the arguments to send to the backend method
## onFind
A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios

Arguments:
* **metadata**
* **options**
   * **limit** - Determines the number of rows returned by the request, on the browser the default is 100 rows
   
   
   #### example:
   ```ts
   await repo(Products).find({
     limit: 10,
     page: 2
   })
   ```
   * **page** - Determines the page number that will be used to extract the data
   
   
   #### example:
   ```ts
   await repo(Products).find({
     limit: 10,
    page: 2
   })
   ```
   * **load**
   * **include** - An option used in the `find` and `findFirst` methods to specify which related entities should be included
   when querying the source entity. It allows you to eagerly load related data to avoid N+1 query problems.
   
   
   #### param:
   An object specifying the related entities to include, their options, and filtering criteria.
   
   Example usage:
   ```
   const orders = await customerRepo.find({
     include: {
       // Include the 'tags' relation for each customer.
       tags: true,
     },
   });
   ```
   In this example, the `tags` relation for each customer will be loaded and included in the query result.
   
   
   #### see:
    - Relations.toMany
    - Relations.toOne
    - RelationOptions
   
   * **where** - filters the data
   
   
   #### example:
   ```ts
   await taskRepo.find({where: { completed:false }})
   ```
   
   
   #### see:
   For more usage examples see [EntityFilter](https://remult.dev/docs/entityFilter.html)
   * **orderBy** - Determines the order of items returned .
   
   
   #### example:
   ```ts
   await repo(Products).find({ orderBy: { name: "asc" }})
   ```
   
   
   #### example:
   ```ts
   await repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
   ```
## clearAllCache
* **clearAllCache**
## entityRefInit
A helper callback that is called whenever an entity is created.
## context
context information that can be used to store custom information that will be disposed as part of the `remult` object
## apiClient
The api client that will be used by `remult` to perform calls to the `api`
## user
* **user**
## liveQueryStorage
* **liveQueryStorage**
## subscriptionServer
* **subscriptionServer**
## liveQueryPublisher
* **liveQueryPublisher**
## liveQuerySubscriber
* **liveQuerySubscriber**
