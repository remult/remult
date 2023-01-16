# Remult
* **Remult**
## repo
Return's a `Repository` of the specific entity type
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   ```
   
   
   
   *see*
   [Repository](https://remult.dev/docs/ref_repository.html)

Arguments:
* **entity**
    - the entity to use
* **dataProvider**
    - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
   
## user
Returns the current user's info
## authenticated
Checks if a user was authenticated
## isAllowed
checks if the user has any of the roles specified in the parameters
   
   
   *example*
   ```ts
   remult.isAllowed("admin")
   ```
   
   
   
   *see*
   
   [Allowed](https://remult.dev/docs/allowed.html)
   

Arguments:
* **roles**
## isAllowedForInstance
checks if the user matches the allowedForInstance callback
   
   
   *see*
   
   [Allowed](https://remult.dev/docs/allowed.html)
   

Arguments:
* **instance**
* **allowed**
## dataProvider
The current data provider
## constructor
Creates a new instance of the `remult` object.

Arguments:
* **http**
## call
Used to call a `backendMethod` using a specific `remult` object
   
   
   *example*
   ```ts
   await remult.call(TasksController.setAll, undefined, true);
   ```
   

Arguments:
* **backendMethod**
    - the backend method to call
* **classInstance**
    - the class instance of the backend method, for static backend methods use undefined
* **args**
    - the arguments to send to the backend method
   
## apiClient
The api client that will be used by `remult` to perform calls to the `api`
## context
context information that can be used to store custom information that will be disposed as part of the `remult` object
## onFind
A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios

Arguments:
* **metadata**
* **options**
   * **limit** - Determines the number of rows returned by the request, on the browser the default is 100 rows
      
      
      *example*
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
      
   * **page** - Determines the page number that will be used to extract the data
      
      
      *example*
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
      
   * **load**
   * **where** - filters the data
      
      
      *example*
      ```ts
      await taskRepo.find({where: { completed:false }})
      ```
      
      
      
      *see*
      For more usage examples see [EntityFilter](https://remult.dev/docs/entityFilter.html)
      
   * **orderBy** - Determines the order of items returned .
      
      
      *example*
      ```ts
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      
      *example*
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
      
## clearAllCache
* **clearAllCache**
## entityRefInit
A helper callback that is called whenever an entity is created.
