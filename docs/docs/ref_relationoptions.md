# RelationOptions
Options for configuring a relation between entities.
## caption
A human readable name for the field. Can be used to achieve a consistent caption for a field throughout the app


#### example:
```ts
<input placeholder={taskRepo.metadata.fields.title.caption}/>
```
## label
A human readable name for the field. Can be used to achieve a consistent label for a field throughout the app


#### example:
```ts
<input placeholder={taskRepo.metadata.fields.title.label}/>
```
## fields
An object specifying custom field names for the relation.
Each key represents a field in the related entity, and its value is the corresponding field in the source entity.
For example, `{ customerId: 'id' }` maps the 'customerId' field in the related entity to the 'id' field in the source entity.
This is useful when you want to define custom field mappings for the relation.
## field
The name of the field for this relation.
## findOptions
Find options to apply to the relation when fetching related entities.
You can specify a predefined set of find options or provide a function that takes the source entity
and returns find options dynamically.
These options allow you to customize how related entities are retrieved.
## defaultIncluded
Determines whether the relation should be included by default when querying the source entity.
When set to true, related entities will be automatically included when querying the source entity.
If false or not specified, related entities will need to be explicitly included using the `include` option.
