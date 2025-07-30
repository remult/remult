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

::: tip
Remult entities can also be used as [Standard Schema](./standard-schema.md) compatible validators, making them interoperable with other validation libraries.
:::
