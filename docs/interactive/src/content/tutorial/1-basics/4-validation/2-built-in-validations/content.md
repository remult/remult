---
type: lesson
title: Built-In Validations
focus: /shared/Task.ts
---

# Built-In Validations

Remult comes with a set of built-in validations that you can easily choose from. These validations are defined in the `Validators` class.

## Minimum Length Validation

For example, let's use the `minLength` validation:

```ts title="shared/Task.ts" add={5-7}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: Validators.minLength(2),
  })
  title = ''

  //....
}
```

### Code Explanation

- We added the `validate` option to the `title` field using the `Validators.minLength(2)` validation.
- This ensures that the `title` field must have at least 2 characters.

## Chaining Multiple Validators

You can also chain multiple validators:

```ts title="shared/Task.ts" add={5-7}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: [Validators.minLength(2), Validators.maxLength(5)],
  })
  title = ''

  //....
}
```

### Code Explanation

- We chained the `Validators.minLength(2)` and `Validators.maxLength(5)` validations.
- This ensures that the `title` field must have at least 2 characters and at most 5 characters.

## Customizing Validation Messages

You can also customize the validation message:

```ts title="shared/Task.ts" add={5-10}
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: [
      Validators.minLength(2),
      Validators.maxLength(5, (length) => `maximum ${length} characters`),
    ],
  })
  title = ''

  //....
}
```

### Code Explanation

- We customized the validation message for the `Validators.maxLength(5)` validation.
- The custom message function `(length) => 'maximum ${length} characters'` will be used if the validation fails.

### Try It Out

Try adding tasks with titles that do not meet these validation requirements to see the validation in action. The errors returned will include the validation messages specified.
