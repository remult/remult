# Allowed

Throughout the api you'll see methods that use the `Allowed` data type, for example `allowApiRead` etc...

The `Allowed` data type can be set to one of the following value:

- true/false

```ts
{
  allowApiRead: true
}
```

- a Role - Checks if the current user has this role.

```ts
{
  allowApiRead: 'admin'
}
```

or with a constant

```ts
{
  allowApiRead: Roles.admin
}
```

- An Array of Roles - checks if the current user has at least one of the roles in the array

```ts
{
  allowApiRead: [Roles.admin, Roles.productManager]
}
```

- A function that get's a `remult` object as a parameter and returns true or false

```ts
{ allowApiRead: Allow.authenticated } }
```

or:

```ts
{ allowApiRead: () => remult.user.name === 'superman' } }
```

# AllowedForInstance

In some cases, the allowed can be evaluated with regards to a specific instance, for example `allowApiUpdate` can consider specific row values.
The Allowed for Instance method accepts two parameters:

1. The relevant `remult` object
2. The relevant entity instance

For Example:

```ts
@Entity<Task>("tasks", {
    allowApiUpdate: (task) => remult.isAllowed("admin") && !task!.completed
})
```
