# SpecificEntityHelper
## create
Creates a new instance of the entity
### example
```ts
let p = this.remult.repo(Products).create();
p.name.value = 'Wine';
await p.save();
```

## find
Returns an array of rows for the specific type
### example
```ts
let products = await remult.repo(Products).find();
for (const p of products) {
  console.log(p.name.value);
}
```

### example
```ts
this.products = await this.remult.repo(Products).find({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
});
```

### see

For all the different options see [FindOptions](ref_findoptions)

## findFirst
returns a single entity based on a filter
### example:

let p = await this.remult.repo(Products).findFirst(p => p.id.isEqualTo(7))

## findId
returns a single entity based on it's id
### example
```ts
let p = await remult.repo(Products).findId(productId);
```

## lookup
Used to get non critical values from the Entity.
The first time this method is called, it'll return a new instance of the Entity.
It'll them call the server to get the actual value and cache it.
Once the value is back from the server, any following call to this method will return the cached row.
### example
```ts
return  remult.repo(Products).lookup(p=>p.id.isEqualTo(productId));
```

## lookupAsync
returns a single row and caches the result for each future call
### example
```ts
let p = await this.remult.repo(Products).lookupAsync(p => p.id.isEqualTo(productId));
```

## count
returns the number of rows that matches the condition
### example
```ts
let count = await this.remult.repo(Products).count(p => p.price.isGreaterOrEqualTo(5))
```

## iterate
Iterate is a more robust version of Find, that is designed to iterate over a large dataset without loading all the data into an array
It's safer to use Iterate when working with large datasets of data.
### example
```ts
for await (let p of this.remult.repo(Products).iterate()){
  console.log(p.name.value);
}
```

### example
```ts
for await (let p of this.remult.repo(Products).iterate({
    orderBy: p => p.name
    , where: p => p.availableFrom.isLessOrEqualTo(new Date()).and(
    p.availableTo.isGreaterOrEqualTo(new Date()))
})){
  console.log(p.name.value);
}
```

## fromPojo
Creates an instance of an entity based on a JSON object
## toApiPojo
Creates a JSON object based on an entity
## toPojoArray
creates an array of JSON objects based on an array of Entities
## gridSettings
returns a grid settings object for the specific entity
## getValueList
returns an array of values that can be used in the value list property of a data control object
