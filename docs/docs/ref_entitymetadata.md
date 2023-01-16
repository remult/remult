# EntityMetadata
Metadata for an `Entity`, this metadata can be used in the user interface to provide a richer UI experience
## apiDeleteAllowed
true if the current user is allowed to delete an entity instance
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiDeleteAllowed){
     //display delete button
   }
   ```
   
## apiInsertAllowed
true if the current user is allowed to create an entity instance
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiInsertAllowed){
     //display insert button
   }
   ```
   
## apiReadAllowed
true if the current user is allowed to read from entity
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiReadAllowed){
     taskRepo.find()
   }
   ```
   
## apiUpdateAllowed
true if the current user is allowed to update an entity instance
   
   
   *example*
   ```ts
   const taskRepo = remult.repo(Task);
   if (taskRepo.metadata.apiUpdateAllowed){
     //Allow user to edit the entity
   }
   ```
   
## caption
A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app
   
   
   *example*
   ```ts
   <h1>Create a new item in {taskRepo.metadata.caption}</h1>
   ```
   
## entityType
The class type of the entity
## fields
Metadata for the Entity's fields
## idMetadata
Metadata for the Entity's id
## key
The Entity's key also used as it's url
## options
The options send to the `Entity`'s decorator
## getDbName
Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option
