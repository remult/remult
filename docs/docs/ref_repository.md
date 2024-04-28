# Repository
used to perform CRUD operations on an `entityType`
## find
returns a result array based on the provided options

Arguments:
* **options**
   * **limit** - Determines the number of rows returned by the request, on the browser the default is 100 rows
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
   * **page** - Determines the page number that will be used to extract the data
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
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
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
## liveQuery
returns a result array based on the provided options

Arguments:
* **options**
   * **limit** - Determines the number of rows returned by the request, on the browser the default is 100 rows
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
   * **page** - Determines the page number that will be used to extract the data
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({
       limit:10,
       page:2
      })
      ```
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
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
## findFirst
returns the first item that matchers the `where` condition
   
   
   #### example:
   ```ts
   await taskRepo.findFirst({ completed:false })
   ```
   
   
   #### example:
   ```ts
   await taskRepo.findFirst({ completed:false },{ createIfNotFound: true })
   ```

Arguments:
* **where** - filters the data
   
   
   #### see:
   [EntityFilter](http://remult.dev/docs/entityFilter.html)
* **options**
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
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
   * **useCache** - determines if to cache the result, and return the results from cache.
   * **createIfNotFound** - If set to true and an item is not found, it's created and returned
## findOne
returns the first item that matchers the `where` condition
   
   
   #### example:
   ```ts
   await taskRepo.findOne({ where:{ completed:false }})
   ```
   
   
   #### example:
   ```ts
   await taskRepo.findFirst({ where:{ completed:false }, createIfNotFound: true })
   ```

Arguments:
* **options**
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
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
   * **useCache** - determines if to cache the result, and return the results from cache.
   * **createIfNotFound** - If set to true and an item is not found, it's created and returned
## findId
returns the items that matches the idm the result is cached unless specified differently in the `options` parameter

Arguments:
* **id**
* **options**
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
      
   * **useCache** - determines if to cache the result, and return the results from cache.
   * **createIfNotFound** - If set to true and an item is not found, it's created and returned
## query
An alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects.

It also has it's own paging mechanism that can be used n paging scenarios.

The `query` method doesn't return an array (as the `find` method) and instead returns an `iterable` `QueryResult` object
which supports iterations using the JavaScript `for await` statement.
   
   
   #### example:
   ```ts
   for await (const task of taskRepo.query()) {
     // do something.
   }
   ```

Arguments:
* **options**
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
      await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
      ```
      
      
      #### example:
      ```ts
      await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
      ```
   * **pageSize** - The number of items to return in each step
   * **progress** - A callback method to indicate the progress of the iteration
## count
Returns a count of the items matching the criteria.
   
   
   #### see:
   [EntityFilter](http://remult.dev/docs/entityFilter.html)
   
   
   #### example:
   ```ts
   await taskRepo.count({ completed:false })
   ```

Arguments:
* **where** - filters the data
   
   
   #### see:
   [EntityFilter](http://remult.dev/docs/entityFilter.html)
## validate
Validates an item
   
   
   #### example:
   ```ts
   const error = repo.validate(task);
   if (error){
     alert(error.message);
     alert(error.modelState.title);//shows the specific error for the title field
   }
   // Can also be used to validate specific fields
   const error = repo.validate(task,"title")
   ```

Arguments:
* **item**
* **fields**
## save
saves an item or item[] to the data source. It assumes that if an `id` value exists, it's an existing row - otherwise it's a new row
   
   
   #### example:
   ```ts
   await taskRepo.save({...task, completed:true })
   ```

Arguments:
* **item**
## insert
Insert an item or item[] to the data source
   
   
   #### example:
   ```ts
   await taskRepo.insert({title:"task a"})
   ```
   
   
   #### example:
   ```ts
   await taskRepo.insert([{title:"task a"}, {title:"task b", completed:true }])
   ```

Arguments:
* **item**
## update
Updates an item, based on its `id`
   
   
   #### example:
   ```ts
   taskRepo.update(task.id,{...task,completed:true})
   ```

Arguments:
* **id**
* **item**
## updateMany
Updates all items that match the `where` condition.

Arguments:
* **options**
   * **where** - filters the data
      
      
      #### see:
      [EntityFilter](http://remult.dev/docs/entityFilter.html)
   * **set**
## delete
Deletes an Item

Arguments:
* **id**
## deleteMany
Deletes all items that match the `where` condition.

Arguments:
* **options**
   * **where** - filters the data
      
      
      #### see:
      [EntityFilter](http://remult.dev/docs/entityFilter.html)
## create
Creates an instance of an item. It'll not be saved to the data source unless `save` or `insert` will be called for that item

Arguments:
* **item**
## toJson
* **toJson**

Arguments:
* **item**
## fromJson
Translates a json object to an item instance

Arguments:
* **x**
* **isNew**
## getEntityRef
returns an `entityRef` for an item returned by `create`, `find` etc...

Arguments:
* **item**
## fields
Provides information about the fields of the Repository's entity
   
   
   #### example:
   ```ts
   console.log(repo.fields.title.caption) // displays the caption of a specific field
   console.log(repo.fields.title.options)// writes the options that were defined for this field
   ```
## metadata
The metadata for the `entity`
   
   
   #### See:
   [EntityMetadata](https://remult.dev/docs/ref_entitymetadata.html)
## addEventListener
* **addEventListener**

Arguments:
* **listener**
## relations
* **relations**

Arguments:
* **item**
