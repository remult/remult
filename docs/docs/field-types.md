# Field Types

## Common field types

There are also several built in Field decorators for common use case:

### @Fields.string

A field of type string

```ts
@Fields.string()
title = '';
```

### @Fields.number

Just like TypeScript, by default any number is a decimal (or float).

```ts
@Fields.number()
price = 1.5
```

### @Fields.integer

For cases where you don't want to have decimal values, you can use the `@Fields.integer` decorator

```ts
@Fields.integer()
quantity = 0;
```

### @Fields.boolean

```ts
@Fields.boolean()
completed = false
```

### @Fields.date

```ts
@Fields.date()
statusDate = new Date()
```

### @Fields.dateOnly

Just like TypeScript, by default any `Date` field includes the time as well.
For cases where you only want a date, and don't want to meddle with time and time zone issues, use the `@Fields.dateOnly`

```ts
@Fields.dateOnly()
birthDate?:Date;
```

### @Fields.createdAt

Automatically set on the backend on insert, and can't be set through the API

```ts
@Fields.createdAt()
createdAt = new Date()
```

### @Fields.updatedAt

Automatically set on the backend on update, and can't be set through the API

```ts
@Fields.updatedAt()
updatedAt = new Date()
```

## JSON Field

You can store JSON data and arrays in fields.

```ts
@Fields.json()
tags: string[] = []
```

## Auto Generated Id Field Types

### @Fields.id

This id value is determined on the backend on insert, and can't be updated through the API.

```ts
@Fields.id()
id:string
```

By default it uses `crypto.randomUUID` to generate the id.

You can change the algorithm used to generate the id by setting the `Fields.defaultIdFactory`
to a different function like:

```ts
import { createId } from '@paralleldrive/cuid2'
Fields.defaultIdOptions = { idFactory: () => createId() }
```

You can also pass an id factory as an option to the `@Fields.id` to have a different value locally.

```ts
import { createId } from '@paralleldrive/cuid2'
// import { v4 as uuid } from 'uuid'

class MyEntity {
  @Fields.id({
    idFactory: () => createId(),
    // idFactory: () => uuid()
  })
  id: string = ''
}
```

So, you can select what you prefer:

- `cuid`: `import { createId } from '@paralleldrive/cuid2'`
- `uuid`: `import { v4 as uuid } from 'uuid'`
- `nanoid`: `import { nanoid } from 'nanoid'`
- `ulid`: `import { ulid } from 'ulid'`

### @Fields.autoIncrement

This id value is determined by the underlying database on insert, and can't be updated through the API.

```ts
@Fields.autoIncrement()
id:number
```

### MongoDB ObjectId Field

To indicate that a field is of type object id, change it's `fieldTypeInDb` to `dbid`.

```ts
@Fields.string({
  dbName: '_id',
  valueConverter: {
    fieldTypeInDb: 'dbid',
  },
})
id: string = ''
```

## Enum Field

Enum fields allow you to define a field that can only hold values from a specific enumeration. The `@Fields.enum` decorator is used to specify that a field is an enum type. When using the `@Fields.enum` decorator, an automatic validation is added that checks if the value is valid in the specified enum.

```ts
@Fields.enum(() => Priority)
priority = Priority.Low;
```

In this example, the `priority` field is defined as an enum type using the `@Fields.enum` decorator. The `Priority` enum is passed as an argument to the decorator, ensuring that only valid `Priority` enum values can be assigned to the `priority` field. The `Validators.enum` validation is used and ensures that any value assigned to this field must be a member of the `Priority` enum, providing type safety and preventing invalid values.

## Literal Fields (Union of string values)

Literal fields let you restrict a field to a specific set of string values using the `@Fields.literal` decorator. This is useful for fields with a finite set of possible values.

```ts
@Fields.literal(() => ['open', 'closed', 'frozen', 'in progress'] as const)
status: 'open' | 'closed' | 'frozen' | 'in progress' = 'open';
```

In this example, we use the `as const` assertion to ensure that the array `['open', 'closed', 'frozen', 'in progress']` is treated as a readonly array, which allows TypeScript to infer the literal types 'open', 'closed', 'frozen', and 'in progress' for the elements of the array. This is important for the type safety of the `status` field.

The `status` field is typed as `'open' | 'closed' | 'frozen' | 'in progress'`, which means it can only hold one of these string literals. The `@Fields.literal` decorator is used to specify that the `status` field can hold values from this set of strings, and it uses the `Validators.in` validator to ensure that the value of `status` matches one of the allowed values.

For better reusability and maintainability, and to follow the DRY (Don't Repeat Yourself) principle, it is recommended to refactor the literal type and the array of allowed values into separate declarations:

```ts
const statuses = ['open', 'closed', 'frozen', 'in progress'] as const;
type StatusType = typeof statuses[number];

@Fields.literal(() => statuses)
status: StatusType = 'open';
```

In this refactored example, `statuses` is a readonly array of the allowed values, and `StatusType` is a type derived from the elements of `statuses`. The `@Fields.literal` decorator is then used with the `statuses` array, and the `status` field is typed as `StatusType`. This approach makes it easier to manage and update the allowed values for the `status` field, reducing duplication and making the code more robust and easier to maintain.

## ValueListFieldType

### Overview

The `ValueListFieldType` is useful in cases where simple enums and unions are not enough, such as when you want to have more properties for each value. For example, consider representing countries where you want to have a country code, description, currency, and international phone prefix.

### Defining a ValueListFieldType

Using enums or union types for this purpose can be challenging. Instead, you can use the `ValueListFieldType`:

```ts
@ValueListFieldType()
export class Country {
  static us = new Country('us', 'United States', 'USD', '1')
  static canada = new Country('ca', 'Canada', 'CAD', '1')
  static france = new Country('fr', 'France', 'EUR', '33')

  constructor(
    public id: string,
    public label: string,
    public currency: string,
    public phonePrefix: string,
  ) {}
}
```

### Using in an Entity

In your entity, you can define the field as follows:

```ts
@Field(() => Country)
country: Country = Country.us;
```

### Accessing Properties

The property called `id` will be stored in the database and used through the API, while in the code itself, you can use each property:

```ts
call('+' + person.country.phonePrefix + person.phone)
```

Note: Only the `id` property is saved in the database and used in the API. Other properties, such as `label`, `currency`, and `phonePrefix`, are only accessible in the code and are not persisted in the database.

### Getting Optional Values

To get the optional values for `Country`, you can use the `getValueList` function, which is useful for populating combo boxes:

```ts
console.table(getValueList(Country))
```

### Special Properties: id and label

The `id` and `label` properties are special in that the `id` will be used to save and load from the database, and the `label` will be used as the display value.

### Automatic Generation of id, caption and label

If `id` and/or `caption` & `label` are not provided, they are automatically generated based on the static member name. For example:

```ts
@ValueListFieldType()
export class TaskStatus {
  static open = new TaskStatus() // { id: 'open', label: 'Open' }
  static closed = new TaskStatus() // { id: 'closed', label: 'Closed' }

  id!: string
  label!: string
  constructor() {}
}
```

In this case, the `open` member will have an `id` of `'open'` and a `label` of `'Open'`, and similarly for the `closed` member.

### Handling Partial Lists of Values

In cases where you only want to generate members for a subset of values, you can use the `getValues` option of `@ValueListFieldType` to specify which values should be included:

```ts
@ValueListFieldType({
  getValues: () => [
    Country.us,
    Country.canada,
    Country.france,
    { id: 'uk', label: 'United Kingdom', currency: 'GBP', phonePrefix: '44' }
  ]
})
```

This approach is useful when you want to limit the options available for a field to a specific subset of values, without needing to define all possible values as static members.

::: warning Warning: TypeScript may throw an error similar to `Uncaught TypeError: Currency_1 is not a constructor`.
This happens in TypeScript versions <5.1.6 and target es2022. It's a TypeScript bug. To fix it, upgrade to version >=5.1.6 or change the target from es2022. Alternatively, you can call the `ValueListFieldType` decorator as a function after the type:

```ts
export class TaskStatus {
  static open = new TaskStatus()
  static closed = new TaskStatus()

  id!: string
  label!: string
  constructor() {}
}
ValueListFieldType()(TaskStatus)
```

:::

### Summary

The `ValueListFieldType` enables the creation of more complex value lists that provide greater flexibility and functionality for your application's needs beyond what enums and unions can offer. By allowing for additional properties and partial lists of values, it offers a versatile solution for representing and managing data with multiple attributes.

## Control Field Type in Database

In some cases, you may want to explicitly specify the type of a field in the database. This can be useful when you need to ensure a specific data type or precision for your field. To control the field type in the database, you can use the `fieldTypeInDb` option within the `valueConverter` property of a field decorator.

For example, if you want to ensure that a numeric field is stored as a decimal with specific precision in the database, you can specify the `fieldTypeInDb` as follows:

```ts
@Fields.number({
  valueConverter: {
    fieldTypeInDb: 'decimal(16,8)'
  }
})
price=0;
```

In this example, the `price` field will be stored as a `decimal` with 16 digits in total and 8 digits after the decimal point in the database. This allows you to control the storage format and precision of numeric fields in your database schema.

## Creating Custom Field Types

Sometimes, you may need to create custom field types to handle specific requirements or use cases in your application. By creating custom field types, you can encapsulate the logic for generating, validating, and converting field values.

### Example: Creating a Custom ID Field Type with NanoID

NanoID is a tiny, secure, URL-friendly, unique string ID generator. You can create a custom field type using NanoID to generate unique IDs for your entities. Here's an example of how to create a custom NanoID field type:

```typescript
import { nanoid } from 'nanoid'
import { Fields, type FieldOptions } from 'remult'

export function NanoIdField<entityType = any>(
  ...options: FieldOptions<entityType, string>[]
) {
  return Fields.string<entityType>(
    {
      allowApiUpdate: false, // Disallow updating the ID through the API
      defaultValue: () => nanoid(), // Generate a new NanoID as the default value
      saving: (_, record) => {
        if (!record.value) {
          record.value = nanoid() // Generate a new NanoID if the value is not set
        }
      },
    },
    ...options,
  )
}
```

In this example, the `NanoIdField` function creates a custom field type based on the `Fields.string` type. It uses the `nanoid` function to generate a unique ID as the default value and ensures that the ID is generated before saving the record if it hasn't been set yet. This custom field type can be used in your entities to automatically generate and assign unique IDs using NanoID.

## Customize DB Value Conversions

Sometimes you want to control how data is saved to the db, or the dto object.
You can do that using the `valueConverter` option.

For example, the following code will save the `tags` as a comma separated string in the db.

```ts
@Fields.object<Task, string[]>({
  valueConverter: {
    toDb: x => (x ? x.join(",") : undefined),
    fromDb: x => (x ? x.split(",") : undefined)
  }
})
tags: string[] = []
```

You can also refactor it to create your own FieldType

```ts
import { Field, FieldOptions, Remult } from 'remult'

export function CommaSeparatedStringArrayField<entityType = any>(
  ...options: (
    | FieldOptions<entityType, string[]>
    | ((options: FieldOptions<entityType, string[]>, remult: Remult) => void)
  )[]
) {
  return Fields.object(
    {
      valueConverter: {
        toDb: (x) => (x ? x.join(',') : undefined),
        fromDb: (x) => (x ? x.split(',') : undefined),
      },
    },
    ...options,
  )
}
```

And then use it:

```ts{9}
@CommaSeparatedStringArrayField()
tags: string[] = []
```

There are several ready made valueConverters included in the `remult` package, which can be found in `remult/valueConverters`

## Class Fields

Sometimes you may want a field type to be a class, you can do that, you just need to provide an implementation for its transition from and to JSON.

For example:

```ts
export class Phone {
  constructor(public phone: string) {}
  call() {
    window.open('tel:' + this.phone)
  }
}

@Entity('contacts')
export class Contact {
  //...
  @Field<Contact, Phone>(() => Phone, {
    valueConverter: {
      fromJson: (x) => (x ? new Phone(x) : undefined!),
      toJson: (x) => (x ? x.phone : undefined!),
    },
  })
  phone?: Phone
}
```

Alternatively you can decorate the `Phone` class with the `FieldType` decorator, so that whenever you use it, its `valueConverter` will be used.

```ts
@FieldType<Phone>({
  valueConverter: {
    fromJson: (x) => (x ? new Phone(x) : undefined!),
    toJson: (x) => (x ? x.phone : undefined!),
  },
})
export class Phone {
  constructor(public phone: string) {}
  call() {
    window.open('tel:' + this.phone)
  }
}

@Entity('contacts')
export class Contact {
  //...
  @Field(() => Phone)
  phone?: Phone
}
```
