# EntityFilter
Used to filter the desired result set
### Basic example
```ts
where: { status:1 } 
```
( this will include only items where the status is equal to 1.

### In Statement
```ts
where:{ status:[1,3,5] }
```

### Not Equal
```ts
where:{ status:{ "!=":1 }}
//or 
where:{ status:{ $ne:1 }}
```

### Not in
```ts
where:{status:{ "!=":[1,2,3] }}
//or 
where:{status:{ $ne:[1,2,3] }}
```

### Comparison operators
```ts
where:{ status:{ ">":1 }}
where:{ status:{ ">=":1 }}
where:{ status:{ "<":1 }}
where:{ status:{ "<=":1 }}
//or
where:{ status:{ $gt:1 }}
where:{ status:{ $gte:1 }}
where:{ status:{ $lt:1 }}
where:{ status:{ $lte:1 }}
```

### Contains
```ts
where:{ name:{ $contains:"joe" }}
```

### Id Equal
```ts
where:{ person:{ $id:123456 }}
```


### Multiple conditions has an `and` relationship
```ts
where: { 
  status:1,
  archive:false
} 
```
### $and
```ts
where: {
    $and:[
        { status:1 },
        { archive:false }
    ]
}
```

### $or
```ts
where: {
    $or:[
        { status:1 },
        { archive:false }
    ]
}
```