# Remult
## repo
Return's a `Repository` of the specific entity type
### example
```ts
const taskRepo = remult.repo(Task);
```

### see
[Repository](https://remult.dev/docs/ref_repository.html)


## user
Returns the current user's info
## setUser
Set's the current user info
## authenticated
Checks if a user was authenticated
## userChange
returns a dispatcher object that fires once a user has changed
## isAllowed
checks if the user has any of the roles specified in the parameters
### example
```ts
remult.isAllowed("admin")
```

### see

[Allowed](https://remult.dev/docs/allowed.html)

## isAllowedForInstance
checks if the user matches the allowedForInstance callback
### see

[Allowed](https://remult.dev/docs/allowed.html)

## constructor
Creates a new instance of the `remult` object.
Creates a new instance of the `remult` object.
## apiBaseUrl
The api Base Url to be used in all remult calls. by default it's set to `/api`.
## _dataSource
The current data provider
## setDataProvider
sets the current data provider
## onFind
A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios
## clearAllCache
## entityRefInit
A helper callback that is called whenever an entity is created.
