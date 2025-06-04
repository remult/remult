---
tags:
  - options
  - bespoke options
  - customizing options
  - type augmentation
  - module augmentation
  - UserInfo
  - RemultContext
  - context
---

# Extensibility

[Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) in TypeScript allows you to extend existing types with custom properties or methods. This enhances the functionality of third-party libraries like `remult` without altering their source code, enabling seamless integration of custom features while maintaining type safety.

In Remult, you can use TypeScript's module augmentation to enhance your application with custom features. Here are some examples:

1. **Add more fields to the User object:** Extend the `UserInfo` interface to include additional fields like `email` and `phone`.
2. **Add custom options/metadata to fields and entities:** Extend the `FieldOptions` or `EntityOptions` interfaces to include custom properties such as `placeholderText` or `helpText`.
3. **Add fields/methods to the `remult.context` object:** Extend the `RemultContext` interface to include additional properties or methods that can be accessed throughout your code.

## Setting Up the types.d.ts File for Custom Type Extensions

To set up the `types.d.ts` file for custom type extensions in Remult:

1. **Create a TypeScript Declaration File:** Add a file named `types.d.ts` in the `src` folder of your project. This file will be used to declare custom type extensions, such as additional user info fields.

   ```ts
   // src/types.d.ts
   export {}

   declare module 'remult' {
     interface UserInfo {
       phone: string // [!code highlight]
       email: string // [!code highlight]
     }
   }
   ```

   The `export {}` is required to indicate that this file is a module, as per the [Vue.js documentation on augmenting global properties](https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties).

2. **Include the Declaration File in tsconfig:** Make sure that the `types.d.ts` file is included in the `include` section of your `tsconfig.json` file. If you have a separate `tsconfig` for the server, ensure that it's also added there.

   ```json
   // tsconfig.server.json
   {
     "compilerOptions": {
       //...
     },
     "include": ["src/server/**/*", "src/shared/**/*", "src/types.d.ts"] // [!code highlight]
   }
   ```

3. **Utilize the Custom Fields in Your Code:** Once you've defined custom fields in the `types.d.ts` file and ensured they're included in your `tsconfig.json`, you can start using them throughout your application. For instance, if you've added `phone` and `email` to the `UserInfo` interface, you can access these properties in your code as follows:

   ```ts
   // Accessing custom user info fields
   console.log(remult.user.phone)
   console.log(remult.user.email)
   ```

   This enables you to seamlessly integrate the new fields into your application's logic and user interface.

## Enhancing Field and Entity Definitions with Custom Options

One of the key motivations for adding custom options to `FieldOptions` or `EntityOptions` is to maintain consistency and centralize the definition of entities and fields in your application. By keeping these definitions close to the entity or field, you ensure a single source of truth for your application's data model. This approach enhances maintainability and readability, as all relevant information and metadata about an entity or field are located in one place. Additionally, it allows for easier integration with UI components, as custom options like `placeholderText` can be directly accessed and used in your frontend code.

For adding custom options to `FieldOptions` or `EntityOptions`, such as `placeholderText`:

1. **Extend FieldOptions:** In your `types.d.ts` file, extend the `FieldOptions` interface to include your custom options. For example:

   ```ts
   declare module 'remult' {
     interface FieldOptions<entityType, valueType> {
       placeholderText?: string // [!code highlight]
     }
   }

   export {}
   ```

2. **Set Custom Option:** Specify the `placeholderText` in your entity field options:

   ```ts
   import { Entity, Fields } from 'remult'

   @Entity('tasks', { allowApiCrud: true })
   export class Task {
     @Fields.uuid()
     id!: string

     @Fields.string({
       placeholderText: 'Please enter a task title', // [!code highlight]
     })
     title = ''

     @Fields.boolean()
     completed = false
   }
   ```

3. **Use in UI:** Access the custom option in your UI components:

   ```html{2}
   <input
     placeholder="{taskRepo.fields.title.options.placeholderText}"
   />
   ```

By following these steps, you can extend `FieldOptions` with custom options that can be utilized throughout your project.

### Extending Remult's `context` Property for Request-Specific Information

Augmenting Remult's `context` property is particularly useful because it allows you to store and access request-specific information throughout your code. This can be especially handy for including data from the request and utilizing it in entities or backend methods.

For example, you can add a custom property `origin` to the `RemultContext` interface:

```ts
declare module 'remult' {
  export interface RemultContext {
    origin?: string // [!code highlight]
  }
}
```

Then, set the `origin` property in the `initRequest` option in the `api.ts` file:

```ts
export const api = remultApi({
  initRequest: async (_, req) => {
    remult.context.origin = req.headers.origin // [!code highlight]
  },
  entities: [Task],
  //...
})
```

You can now use the `origin` property anywhere in your code, for example:

```ts
@BackendMethod({ allowed: Roles.admin })
static async doSomethingImportant() {
  console.log(remult.context.origin); // [!code highlight]
}
```

or in an entity's saving event:

```ts
@Entity<Task>("tasks", {
  saving: task => {
    task.lastUpdateDate = new Date();
    task.lastUpdateUser = remult.user?.name;
    task.lastUpdateOrigin = remult.context.origin; // [!code highlight]
  },
  //...
});
```

By leveraging module augmentation, you can tailor Remult to your specific needs, adding custom options and extending interfaces to suit your application's requirements.
