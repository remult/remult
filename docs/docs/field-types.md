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

## Auto Generated Id Field Types

### @Fields.uuid

This id value is determined on the backend on insert, and can't be updated through the API.

```ts
@Fields.uuid()
id:string
```

### @Fields.cuid

This id value is determined on the backend on insert, and can't be updated through the API.

```ts
@Fields.cuid()
id:string
```

### @Fields.autoIncrement

This id value is determined by the underlying database on insert, and can't be updated through the API.

```ts
@Fields.autoIncrement()
id:number
```

## Enum Field

Enum fields will work just like any other basic type.

```ts
@Fields.object()
priority = Priority.Low
```

## JSON Field

You can store JSON data and arrays in fields.

```ts
@Fields.json()
tags: string[] = []
```

## MongoDB ObjectId Field

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
