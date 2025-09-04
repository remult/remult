---
type: lesson
title: Extending Existing Validations
focus: /shared/Task.ts
---

# Extending Existing Validations

In this lesson, you'll learn how to extend and customize existing validations in Remult. Validations in Remult are simply functions that you can call and combine as needed.

### Example: Unique Title Validation

Let's extend the existing `unique` validation to check that no two tasks exist with the same title, as long as the title is not empty.

```solution:/shared/Task.ts title="shared/Task.ts"  collapse={1-5, 16-99} add={11-13}

```

```typescript title="shared/Task.ts" add={6-8}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: (task, e) => {
      if (task.title != '') Validators.unique(task, e)
    },
  })
  title = ''

  //....
}
```

### Code Explanation

- The `validate` function checks if the `title` is not empty.
- If the `title` is not empty, the `Validators.unique` function is called to ensure that the task title is unique within the entity.
- This approach allows you to combine and extend existing validations to suit your application's needs.

### Try It Out

Test this extended validation by trying to add tasks with duplicate titles. Notice that the validation prevents duplicates only when the title is not empty.
