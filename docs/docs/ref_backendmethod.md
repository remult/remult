# BackendMethod
Decorator indicating that the decorated method runs on the backend.
It allows the method to be invoked from the frontend while ensuring that the execution happens on the server side.
By default, the method runs within a database transaction, meaning it will either complete entirely or fail without making any partial changes.
This behavior can be controlled using the `transactional` option in the `BackendMethodOptions`.

For more details, see: [Backend Methods](https://remult.dev/docs/backendMethods.html).


#### example:
```typescript
@BackendMethod({ allowed: true })
async someBackendMethod() {
  // method logic here
}
```
## allowed
Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)
## apiPrefix
Used to determine the route for the BackendMethod.


#### example:
```ts
{allowed:true, apiPrefix:'someFolder/'}
```
## transactional
Controls whether this `BackendMethod` runs within a database transaction. If set to `true`, the method will either complete entirely or fail without making any partial changes. If set to `false`, the method will not be transactional and may result in partial changes if it fails.


#### default:
```ts
true
```


#### example:
```ts
{allowed: true, transactional: false}
```
## queue
EXPERIMENTAL: Determines if this method should be queued for later execution
## blockUser
EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running
## paramTypes
* **paramTypes**
