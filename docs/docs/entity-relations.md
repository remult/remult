# Relations between entities

## Many to One relation
Let's consider the following use case, we have a todo app, with a `Task` entity. We want to assign each `Task` to a category.

We'll add the `Category` entity.
*Category.ts*
```ts
import { Entity, Field, IdEntity } from "remult";
import { Task } from "./Task";

@Entity('categories', {
    allowApiCrud: true
})
export class Category extends IdEntity {
    @Fields.string()
    name = '';
}
```

and we'll use it as a field in the `Task` entity.

Note that we set the `valueType` option of the `Field` decorator, because `create-react-app` doesn't support `emitDecoratorMetadata` 

```ts{2,12-13}
import { Entity, Field, IdEntity } from "remult";
import { Category } from "./Category";

@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Field(() => Category)
    category?: Category;
}
```

When a `Task` is loaded, it's `Category` is also automatically loaded, using a cache mechanism to prevent the reload of an already loaded `Category`. To disable that, set the `lazy` option to `true`.
For more information see [lazy loading of related entities](lazy-loading-of-related-entities)
