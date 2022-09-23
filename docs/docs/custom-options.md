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
# Custom options
There are many use cases where you want to add your own options to the `FieldOptions` or the `EntityOptions` and have them available in that Entity's metadata.

You can do that using [Typescript Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)

To demo that, let's say that we want to have a custom `placeholderText` options to be set in the Field decorator, and later used in our UI.

Follow these Steps:
1. In a typescript file that is visible throughout your project add the following code:
   ```ts
   declare module 'remult' {
       export interface FieldOptions<entityType, valueType> {
           placeholderText?: string
       }
   }
   ```
   This will add the optional `placeholderText` property to the `FieldOptions` interface
2. In your entity, set the `placeholderText` value.
   ```ts{7}
   import { Entity, Fields } from "remult";
   @Entity("tasks", { allowApiCrud: true })
   export class Task {
       @Fields.uuid()
       id!: string;
       @Fields.string({
         placeholderText:'Please enter a task title'
       })
       title = '';
       @Fields.boolean()
       completed = false;
   }
   ```
3. Use that property in your UI
   ```html
   <input placeholder={taskRepo.metadata.fields.title.placeholderText}/>
   ```

# Augmenting `UserInfo` interface
If you want to have more information in `remult.user` you can augment the `UserInfo` interface
```ts
declare module 'remult' {
    export interface RemultContext {
      phone:string,
      email:string
    }
}
```

Then later in the code, you can use it just like any other `UserInfo` property
```ts
console.log(remult.user.phone);
```

# Augmenting remult's `context` property
You can augment remult's context property in a similar way:
```ts
declare module 'remult' {
    export interface RemultContext {
      // anything you want
    }
}
```

One use case for this, is to include information from the request, and use that information in an entity or a backend method.

Here's an example:
1. Add a custom property `origin` to `RemultContext`
   ```ts
   declare module 'remult' {
     export interface RemultContext {
        origin?: string
     }
   }  
   ```
2. Set the `origin` property in the `initRequest` method in the `api.ts` file.
   ```ts
   export const api = remultExpress({
     initRequest: async (_, req) => {
         remult.context.origin = req.headers.origin;
     },
     entities: [Task],
     //...
   ```
3. Use it anywhere in the code:
   ```ts
   @BackendMethod({ allowed: Roles.admin })
   static async doSomethingImportant() {
      console.log(remult.context.origin);
   }
   ```
   or
   ```ts
   @Entity<Task>("tasks", {
      saving:task=>{
            task.lastUpdateDate = new Date();
            task.lastUpdateUser = remult.user?.name;
            task.lastUpdateOrigin = remult.context.origin;
      },
      //...
   ```
   


For more info see the [Augmenting Global Properties](https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties) article in `vue.js` docs.