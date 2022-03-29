# Field Types
## Basic field types
The most commonly used field type is `Field` that is used to describe most fields.

*example*
```ts
@Fields.string()
title = '';
```

There are also several more built in Field decorators for common use case:
### @Fields.integer
Just like typescript, by default any number is a decimal (or float). 
For cases where you don't want to have decimal values, you can use the `@Fields.integer` decorator

*example*
```ts
@Fields.integer()
quantity = 0;
```

### @Fields.dateOnly
Just like typescript, by default any `Date` field includes the time as well.
For cases where you only want a date, and don't want to meddle with time and time zone issues, use the `@Fields.dateOnly`

*example*
```ts
@Fields.dateOnly()
fromDate?:Date;
@Fields.dateOnly()
toDate?:Date;
```

## Enum Field
Enum fields will work just like any other basic type.
```ts
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Field(() => Priority)
    direction = Priority.Low;
}

export enum Priority {
    Low,
    High,
    Critical
}
```
String enums will also work

```ts
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Field(() => Priority)
    direction = Priority.Low;
}

export enum Priority {
    Low="Low",
    High="High",
    Critical="Critical"
}
```

## JSON Field
You can store JSON data and arrays in fields
*example*
```ts
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Fields.object()
    tags: string[] = [];
}
```

## Change the way values are saved to the db
Sometimes you want to control how data is saved to the db, or the dto object.
You can do that using the `valueConverter` option.

For example, the following code will save the `tags` as a comma separated string in the db.
```ts{9-15}
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Fields.object<Task, string[]>({
        valueConverter: {
            toDb: x => x ? x.join(',') : undefined,
            fromDb: x => x ? x.split(',') : undefined
        }
    })
    tags: string[] = [];
}
```

You can also refactor it to create your own FieldType

```ts
import { Field, FieldOptions, Remult } from "remult";

export function CommaSeparatedStringArrayField<entityType = any>(
    ...options: (FieldOptions<entityType, string[]> |
        ((options: FieldOptions<entityType, string[]>, remult: Remult) => void))[]) {
    return Fields.object({
        valueConverter: {
            toDb: x => x ? x.join(',') : undefined,
            fromDb: x => x ? x.split(',') : undefined
        }
    }, ...options);
}
```
And then use it:
```ts{9}
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @CommaSeparatedStringArrayField()
    tags: string[] = [];
}
```

There are several ready made valueConverters included in the `remult` package, which can be found in `remult/valueConverters`

## Class Fields
Sometimes you may want a field type to be a class, you can do that, you just need to provide an implementation for it's transition from and to JSON.

For example:
```ts{9-30}
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
    @Field<Task, Phone>(() => Phone, {
        valueConverter: {
            fromJson: x => x ? new Phone(x) : undefined!,
            toJson: x => x ? x.phone : undefined!
        }
    })
    phone?: Phone;
}

export class Phone {
    constructor(public phone: string) { }
    call() {
        window.open("tel:" + this.phone);
    }
}
```

Alternatively you can decorate the `Phone` class with the `FieldType` decorator, so that whenever you use it, it's `valueConverter` will be used.
```ts{10,14-19}
@Entity('tasks', {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;

    @Field(() => Phone)
    phone?: Phone;
}

@FieldType<Phone>({
    valueConverter: {
        fromJson: x => x ? new Phone(x) : undefined!,
        toJson: x => x ? x.phone : undefined!
    }
})
export class Phone {
    constructor(public phone: string) { }
    call() {
        window.open("tel:" + this.phone);
    }
}
```