---
llm: "Field validation - required/minLength shortcuts, custom validate functions, and the built-in Validators set."
---

# Validation

Validation is a key part of any application, and you will see that it's builtin Remult !

First of all, some props brings automatic validation, for example `required` and `minLength` for strings :

```ts
@Fields.string({ required: true, minLength: 5 })
title = ''
```

You can establish your own validation rules by using the `validate` prop and do any custom code you want :

```ts
@Fields.string({
   validate: (task)=> task.title.length > 5 || "too short"
})
title = ''
```

You want to focus only on the value?

```ts
@Fields.string({
   validate: valueValidator(value => value.length > 5)
})
title = ''
```

The `validate` prop can also use buildin validators like this :

```ts
import { Validators } from 'remult'

@Fields.string({
   validate: Validators.minLength(5)
})
title = ''
```

It supports array of validators as well :

```ts
import { Validators } from 'remult'

@Fields.string({
   validate: [
      Validators.minLength(5),
      Validators.maxLength(10),
      (task)=> task.title.startsWith('No') || "Need to start with No"
   ]
})
title = ''
```

## Built-in validators

Here is the full list of validators available on `Validators`, grouped by the kind of value they check.

::: tip
Most validators ignore empty values (`null` / `undefined`), so an empty optional field passes. To make a field mandatory, add `Validators.required`.
:::

### General

| Validator                     | Checks that the value...                               | Default message                  |
| ----------------------------- | ------------------------------------------------------ | -------------------------------- |
| `Validators.required`         | is not `null`, `undefined` or an empty string          | `Should not be empty`            |
| `Validators.notNull`          | is not `null` (empty string and `undefined` pass)      | `Should not be null`             |
| `Validators.in(values)`       | is one of the given values                             | `Value must be one of: ...`      |
| `Validators.enum(enumObj)`    | is one of the values of a TypeScript `enum`            | `Value must be one of ...`       |
| `Validators.unique`           | does not already exist in the database (backend only)  | `already exists`                 |
| `Validators.relationExists`   | points to a related row that exists (backend only)     | `Relation value does not exist`  |

```ts
import { Entity, Fields, Relations, Validators } from 'remult'

enum Priority {
  Low = 'low',
  High = 'high',
}

@Entity('tasks', { allowApiCrud: true })
export class Task {
  @Fields.id()
  id = ''

  @Fields.string({ validate: Validators.required })
  title = ''

  @Fields.string({ validate: Validators.in(['open', 'in-progress', 'done']) })
  status = 'open'

  @Fields.string<Task, Priority>({ validate: Validators.enum(Priority) })
  priority = Priority.Low

  @Relations.toOne(() => Category, { validate: Validators.relationExists })
  category?: Category
}
```

::: tip
`Fields.literal` and `Fields.enum` already apply `Validators.in` / `Validators.enum` for you, so you only need these validators when using a plain `Fields.string` or `Fields.number`.
:::

### Strings

| Validator                     | Checks that the value...                   | Default message                          |
| ----------------------------- | ------------------------------------------ | ---------------------------------------- |
| `Validators.minLength(n)`     | has at least `n` characters                | `Value must be at least n characters`    |
| `Validators.maxLength(n)`     | has at most `n` characters                 | `Value must be at most n characters`     |
| `Validators.email`            | looks like an email address                | `Invalid Email`                          |
| `Validators.url`              | can be parsed as a URL                     | `Invalid Url`                            |
| `Validators.regex(regex)`     | matches the regular expression             | `Invalid value`                          |

```ts
@Fields.string({ validate: [Validators.required, Validators.email] })
email = ''

// optional fields: null is skipped, but an empty string is validated
@Fields.string({ allowNull: true, validate: Validators.url })
website: string | null = null

@Fields.string({
  allowNull: true,
  validate: Validators.regex(/^\d{3}-\d{7}$/, 'Phone must look like 050-1234567'),
})
phone: string | null = null
```

`minLength` and `maxLength` are also available as field options, as shown at the top of this page: `@Fields.string({ minLength: 2, maxLength: 50 })`.

### Numbers

| Validator                       | Checks that the value...                    | Default message                              |
| ------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `Validators.min(n)`             | is greater than or equal to `n`             | `Value must be bigger than or equal to n`    |
| `Validators.max(n)`             | is less than or equal to `n`                | `Value must be smaller than or equal to n`   |
| `Validators.range([min, max])`  | is between `min` and `max` (inclusive)      | `Value must be between min and max`          |

```ts
@Fields.number({ validate: Validators.min(0) })
price = 0

@Fields.integer({ validate: Validators.max(100) })
discountPercent = 0

@Fields.integer({ validate: Validators.range([1, 5]) })
rating = 1
```

## Custom error messages

Every built-in validator accepts an optional message. For validators without arguments, pass the message directly; for validators with arguments, pass it as the second argument:

```ts
@Fields.string({ validate: Validators.required('Please enter a title') })
title = ''

@Fields.number({ validate: Validators.min(0, 'Price cannot be negative') })
price = 0
```

## Backend validators

Some validators like `unique` is running on the backend side, and nothing changes, you just have to use it :

```ts
import { Validators } from 'remult'

@Fields.string({
   validate: [
      Validators.minLength(5),
      Validators.unique()
   ]
})
title = ''
```

Also in custom validator you can check if you are in the backend or not :

```ts
import { Validators, isBackend } from 'remult'

@Fields.string({
   validate: [
      Validators.unique(),
      (task) => {
         if (isBackend()) {
            // check something else...
            // throw "a custom message"
         }
      }
   ]
})
title = ''
```

If you want to customize the error message, you can do it globally :

```ts
Validators.unique.defaultMessage = 'Existe déjà!'
```

For validators with arguments, the default message can also be a function of those arguments:

```ts
Validators.min.defaultMessage = (min) => `Must be at least ${min}`
Validators.range.defaultMessage = ([min, max]) => `Pick a number from ${min} to ${max}`
```

::: tip
Remult entities can also be used as [Standard Schema](./standard-schema.md) compatible validators, making them interoperable with other validation libraries.
:::
