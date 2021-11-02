# Field Types
## Basic field types
The most commonly used field type is `Field` that is used to describe most fields.

*example*
```ts
@Field()
title:string='';
```

There are also several more built in Field decorators for common use case:
### @IntegerField
Just like typescript, by default any number is a decimal (or float). 
For cases where you don't want to have decimal values, you can use the `@IntegerField` decorator

*example*
```ts
@IntegerField()
quantity:number=0;
```

### @DateOnlyField
Just like typescript, by default any `Date` field includes the time as well.
For cases where you only want a date, and don't want to meddle with time and time zone issues, use the `@DateOnlyField`

*example*
```ts
@DateOnlyField()
fromDate?:Date;
@DateOnlyField()
toDate?:Date;
```

## Arrays and complex JSON
You can store arrays and JSON objects in fields as well

... TBC