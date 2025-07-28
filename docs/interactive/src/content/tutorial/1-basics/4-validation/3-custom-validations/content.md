---
type: lesson
title: Custom Validations
focus: /shared/Task.ts
---

# Custom Validations

You can also define custom validation logic for your fields. Let's add a custom validation to the `title` field to ensure it is longer than 2 characters.

```ts title="shared/Task.ts" add={5-7}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: (task) => task.title.length > 2 || 'too short',
  })
  title = ''

  //....
}
```

### Code Explanation

- We added a custom validation function to the `title` field using the `validate` option.
- The custom validation function checks if the `title` field's length is greater than 2. If the condition is not met, it returns the error message `'too short'`.
- We specified the `Task` type in the generic definition of `Fields.string<Task>`, which provides type safety and ensures the custom validation function receives the correct type.
- This arrow function will run both on the frontend as frontend validation and on the backend as API validation, ensuring consistent validation across the stack.

### Try It Out

Try adding tasks with titles shorter than 3 characters to see the custom validation in action. The error message `'too short'` will be returned if the validation fails.
