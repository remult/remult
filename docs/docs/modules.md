# Modules

The module system arrived in `remult@3.0.6`, the idea is to pack features in a single place.
Like this, it will be possible to share features between projects in a more convinient way.

Here is the [definition](/docs/ref_remultserveroptions#modules).
::: info
Come on Discord to share your ideas around modules!
:::

## Styles

### Local modules

Essentially, a local module is a way to organize your own code into a single place. You still have the full control of the code, and you can use the full power of `remult` in it.

You can also move this folder to a different project without many hassle!

### Library modules

Here, you use a module via a library, you install it and enjoy it. This library will probably allow you some configuration & you can tweak things.

When you have a great improvement idea, you should report it to the library author and follow the process.

### Cloned modules

It's a bit of a mix of the two previous styles. You clone a module from a repository and use it in your project, now you "own" it. Like this, you can tweak it to your needs.

## Some conventions

### Folder structure

In `src`, we like to have a `modules` folder. You will find all your local modules here.

In a module, the first level of folder is for the client, and we have a `server` folder for the server side code. Like this:

```ts
|- modules
	|- myModule
		|- index.ts                 // client side code (Role_MyModule, ...)
		|- myModuleEntities.ts      // entities
		|- myModuleController.ts    // controllers
		|- server
			|- index.ts             // server side code
   |- ...
|- ...
```

### Alias

With alias, you can access your modules in a more convinient way.

Depending on your framework, it can vary, but essentially, you will have a `tsconfig.json` file in your project that look like this:

```json
{
  "compilerOptions": {
    "paths": {
      "$modules": ["./src/modules"],
      "$modules/*": ["./src/modules/*"]
    }
  }
}
```

You will then be able to access your modules like this:

```ts
import { myModule } from '$module/myModule/server'
```

### Roles

To manage well [Access Control](/docs/access-control) of our app, we use a lot `remult.user.roles` that contains the list of roles of the user.

In the end, `roles` is just an array of strings, but as we want to have a better DX, we use a `Roles` object to manage them. Like this, no typo, no missing role, etc.

Based on that, it's recommended to have a `Roles.ts` having the list of all the roles of the app _(including all modules roles)_.

```ts
// Roles.ts
export const Roles = {
  // app roles
  Admin: 'admin',
  CanStrartProcess_007: 'canStrartProcess_007',

  // modules roles
  ...Roles_Auth,
  // ...
} as const
```

To be use like `Roles.Admin`, `Roles.CanStrartProcess_007`, `Roles.MyModule_Admin`, etc.

In a module, you will also have a file `Roles_MyModule.ts` _(client side)_ having the list of all the roles of the module.

```ts
export const Roles_MyModule = {
  MyModule_Admin: 'MyModule.Admin',
  // MyModule_Read_Stuff: "MyModule.Read_Stuff",
} as const
```

Like this, module users will be able to get all these roles in their Roles object.
