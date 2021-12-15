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
    @Field()
    name: string = '';
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
    @Field()
    title: string = '';
    @Field()
    completed: boolean = false;
    @Field(options => options.valueType = Category )
    category?: Category;
}
```

When a `Task` is loaded, it's `Category` is also automatically loaded, using a cache mechanism to prevent the reload of an already loaded `Category`. To disable that, set the `lazy` option to `true`.
For more information see [lazy loading of related entities](lazy-loading-of-related-entities)



## One to Many
```ts{1-2,11-16}
import { Entity, Field, IdEntity, OneToMany, Remult } from "remult";
import { Task } from "./Task";

@Entity('categories', {
    allowApiCrud: true
})
export class Category extends IdEntity {
    @Field()
    name: string = '';

    constructor(private remult: Remult) {
        super();
    }
    tasks = new OneToMany(this.remult.repo(Task), {
        where: { category: this }
    })
}
```

The `tasks` member is an accessor that makes it easy to load the `tasks` based on the relation described in the `options` passed to it.

you can use the `load` method to load the tasks:
```ts
await category.tasks.load();
```
Once loaded the tasks are also available using it's `lazyItems` member.
* Note that if the `lazyItems` member is called before it was loaded, it'll return an empty array and will try to load the items. Once the items are loaded they can be accessed using the `lazyItems` member

You can also use it's `create` method to create a new `Task` that has it's `category` field already set.
```ts
let task = await category.tasks.create();
```
Is short for:
```ts
let task = remult.repo(Task).create({ category: category });
```

## Many to Many
In a case where a task can have multiple categories, we'll use another entity to represent that relation.
*TaskCategories.ts*
```ts
import { Entity, Field, IdEntity } from "remult";
import { Category } from "./Category";
import { Task } from "./Task";

@Entity("taskCategories", { allowApiCrud: true })
export class TaskCategories extends IdEntity {
    @Field(options => options.valueType = Task)
    task?: Task;
    @Field(options => options.valueType = Category)
    category?: Category
}
```
*Category.ts*
```ts{15}
import { Entity, Field, IdEntity, OneToMany, Remult } from "remult";
import { Task } from "./Task";
import { TaskCategories } from "./TaskCategories";

@Entity('categories', {
    allowApiCrud: true
})
export class Category extends IdEntity {
    @Field()
    name: string = '';

    constructor(private remult: Remult) {
        super();
    }
    tasks = new OneToMany(this.remult.repo(TaskCategories), {
        where: { category: this }
    })
}
```
*Task.ts*
```ts{13-18}
import { Entity, Field, IdEntity, OneToMany, Remult } from "remult";
import { Category } from "./Category";
import { TaskCategories } from "./TaskCategories";

@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Field()
    title: string = '';
    @Field()
    completed: boolean = false;
    constructor(private remult: Remult) {
        super();
    }
    categories = new OneToMany(this.remult.repo(TaskCategories), {
        where: { task: this }
    })
}
```