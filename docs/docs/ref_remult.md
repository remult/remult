# Remult
* **Remult**
## user
Returns the current user's info
## userChange
returns a dispatcher object that fires once a user has changed
## constructor
Creates a new instance of the `remult` object.

Arguments:
* **provider**
## apiBaseUrl
The api Base Url to be used in all remult calls. by default it's set to `/api`.
## _dataSource
The current data provider
## entityRefInit
A helper callback that is called whenever an entity is created.
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
* **dataProvider**
## setUser
Set's the current user info

Arguments:
* **info**
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
## setDataProvider
sets the current data provider

Arguments:
* **dataProvider**
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
      
   * **load**
## clearAllCache
* **clearAllCache**
