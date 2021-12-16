# Allowed - who can run this?

Throughout the api you'll see methods that use the `Allowed` data type, for example `allowApiRead` etc...

The `Allowed` data type can be set to one of the following value:
* true/false
```ts
{ allowApiRead: true }
```
* a Role - Checks if the current user has this role.
```ts
{ allowApiRead: Roles.admin }
```
* An Array of Roles - checks if the current user has at least one of the roles in the array
```ts
{ allowApiRead: [Roles.admin, Roles.productManager] }
```

* A function that get's a `remult` object as a parameter and returns true or false
```ts
{ allowApiRead: Allow.authenticated } }
```
or:
```ts
{ allowApiRead: r => r.user.name == 'superman' } }
```