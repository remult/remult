# Entity
## save
saves the changes made to this instance to the data source
### example
```ts
let p = await this.context.for(Products).findFirst(p => p.id.isEqualTo(7));
p.price.value = 10;
await p.save();
```

### example
```ts
let p = this.context.for(Products).create();
p.name.value = 'Wine';
await p.save();
```

## delete
Delete a specific entity instance
### example
```ts
let p = await this.context.for(Products).findFirst(p => p.id.isEqualTo(7));
await p.delete();
```

## isValid
returns true if there are no validation errors for the entity or any of it's columns
## isNew
returns true if this entity is new and not yet exists in the db
## wasChanged
returns true if a change was made to the instance
## undoChanges
returns all the values to their original value, prior to any change
## reload
reloads the data for the specific entity instance from data source
### example
```ts
await p.reload();
```

