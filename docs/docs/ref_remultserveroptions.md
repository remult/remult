# RemultServerOptions
* **RemultServerOptions**
## entities
Entities to use for the api
## controllers
Controller to use for the api
## getUser
Will be called to get the current user based on the current request

Arguments:
* **request**
## initRequest
Will be called for each request and can be used for configuration

Arguments:
* **request**
* **options**
   * **liveQueryStorage**
   * **remult**
## initApi
Will be called once the server is loaded and the data provider is ready

Arguments:
* **remult**
## dataProvider
Data Provider to use for the api.
   
   
   #### see:
   [Connecting to a Database](https://remult.dev/docs/databases.html).
## ensureSchema
Will create tables and columns in supporting databases. default: true
   
   
   #### description:
   when set to true, it'll create entities that do not exist, and add columns that are missing.
## rootPath
The path to use for the api, default:/api
   
   
   #### description:
   If you want to use a different api path adjust this field
## defaultGetLimit
The default limit to use for find requests that did not specify a limit
## logApiEndPoints
When set to true (default) it'll console log each api endpoint that is created
## subscriptionServer
A subscription server to use for live query and message channels
## liveQueryStorage
A storage to use to store live queries, relevant mostly for serverless scenarios or larger scales
## contextSerializer
Used to store the context relevant info for re running a live query
## admin
When set to true, will display an admin ui in the `/api/admin` url.
Can also be set to an arrow function for fine grained control
   
   
   #### example:
   ```ts
   allowed: ()=> remult.isAllowed('admin')
   ```
## queueStorage
Storage to use for backend methods that use queue
## error
This method is called whenever there is an error in the API lifecycle.
   
   
   #### returns:
   A promise that resolves when the error handling is complete.
   
   
   #### example:
   ```ts
   export const api = remultExpress({
     error: async (e) => {
       if (e.httpStatusCode == 500) {
         e.sendError(500, { message: "An error occurred" })
       }
     }
   })
   ```

Arguments:
* **info** - Information about the error.
   * **req** - The request object.
   * **entity** - (Optional) The entity metadata associated with the error, if applicable.
   * **exception** - (Optional) The exception object or error that occurred.
   * **httpStatusCode** - The HTTP status code.
   * **responseBody** - The body of the response.
   * **__type** - A method to send a custom error response. Call this method with the desired HTTP status code and response body.
