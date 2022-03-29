# Lazy loading of related entities
When an `entity` is loaded, its `many to one` relation fields are also automatically loaded, using a cache mechanism to prevent the reload of an already loaded `entity`. To disable that, set the `lazy` option to `true`.

let's use the example in [entity relations](entity-relations)

```ts{11}
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Field(() => Category, {
        lazy:true
    })
    category?: Category;
}
```

#### Working with Lazy
* To manually load a related entity, use it's `FieldRef`'s load method.
  ```ts
  await task.$.category!.load()
  ```
* If the field was not loaded, and you'll access it - it'll return `undefined` and will issue a request to load the related entity. once that entity is loaded, the field will return its value.
* To check if a field has value, you can use the `valueIsNull` method of its `FieldRef`
  ```ts
  await task.$.category!.valueIsNull()
  ```
* You can override the default `lazy` definitions by setting the `load` option of the repository's  `find` method.
  * To load none of the related entities use:
    ```ts
    await taskRepo.find({
        load: () => []
    })
    ```
  * To specify which fields to load:
    ```ts
    await taskRepo.find({
      load: task => [task.category!]
    })
    ```  
