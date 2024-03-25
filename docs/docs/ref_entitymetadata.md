# EntityMetadata
Metadata for an `Entity`, this metadata can be used in the user interface to provide a richer UI experience
## entityType
The class type of the entity
## key
The Entity's key also used as it's url
## fields
Metadata for the Entity's fields
## caption
A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app
   
   
   #### example:
   ```ts
   <h1>Create a new item in {taskRepo.metadata.caption}</h1>
   ```
## dbName
The name of the table in the database that holds the data for this entity.
If no name is set in the entity options, the `key` will be used instead.
## options
The options send to the `Entity`'s decorator
## apiUpdateAllowed
true if the current user is allowed to update an entity instance
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiUpdateAllowed(task)){
     // Allow user to edit the entity
   }
   ```

Arguments:
* **item**
## apiReadAllowed
true if the current user is allowed to read from entity
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiReadAllowed){
     await taskRepo.find()
   }
   ```
## apiDeleteAllowed
true if the current user is allowed to delete an entity instance
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiDeleteAllowed(task)){
     // display delete button
   }
   ```

Arguments:
* **item**
## apiInsertAllowed
true if the current user is allowed to create an entity instance
   
   
   #### example:
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiInsertAllowed(task)){
     // display insert button
   }
   ```

Arguments:
* **item**
## getDbName
* **getDbName**
## idMetadata
Metadata for the Entity's id
