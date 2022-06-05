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


## One to Many Relationship
Now consider that we want to keep a history of changes that happen to our `Task` object.  We will create a `HistoryRecord` entity that will store records of changes to our task

```ts
import { Entity, IdEntity } from "remult";

@Entity('historyRecords', {
    allowApiCrud: true
})
export class HistoryRecord extends IdEntity {
    @Fields.string()
    taskId: String;

    @Fields.string()
    event: String;
}
```

Each `HistoryRecord` object will reference its corresponding `Task` by `taskId`.

Now, we can update Task to include an array of `HistoryRecord` objects when it is loaded:

```ts{3,15-19}
import { Entity, Field, IdEntity } from "remult";
import { Category } from "./Category";
import { HistoryRecord } from "./HistoryRecord";

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
    @Fields.object((options, remult) => {
        options.serverExpression = async (task) =>
            remult.repo(HistoryRecord).find({ where: { taskId: task.id } })
    })
    history: HistoryRecord[]

}
```

`options.serverExpression` is a function that can resolve a field from anywhere.  In this example, we're simply calling the `HistoryRecord` table to resolve all records where the `taskId` matches the id of the task being resolved.  Despite being decorated with `@Fields.object...`, the `history` attribute will not be stored on the `tasks` table in the database.