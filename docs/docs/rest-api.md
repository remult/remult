# Entity Rest Api Breakdown

All entities automatically expose a rest api based on the parameters defined in it's decorator.

The api supports the following actions (we'll use the `products` entity as an example, and a specific product with an id=7):


| Http Method | Description | example | requires |
| ----- | -----| ----- | ------ |
| GET | returns an array of rows  | /api/products | allowApiRead |
| GET | returns a single row based on it's id  | /api/products/7 | allowApiRead |
| POST | creates a new row based on the object sent in the body, and returns the new row | /api/products | allowApiInsert  |
| PUT | updates an existing row based on the object sent in the body and returns the result  | /api/products/7 | allowApiUpdate |
| DELETE | deletes an existing row | /api/products/7 | allowApiDelete |

## Sort 
Add _sort and _order (ascending order by default)

```
https://mySite.com/api/products?_sort=price&_order=desc
```

## Filter
You can filter the rows using different operators
```
https://mySite.com/api/products?price_gte=5&price_lte=10
```
### Filter Operators

| operator | description | example |
| --- | --- | ---|
| `none` | Equal To | price=10 |
| _ne | Not Equal | price_ne=10 |
| _in | In list | price_in=[10, 85, 116] |
| _contains | Contains a string | name_contains=ee |
| _st | Starts with a string | name_st=Bee |
| _gt | Greater than | price_gt=10 |
| _gte | Greater than or equal | price_gte=10 |
| _lt | Lesser than | price_lt=10 |
| _lte | Lesser than or equal | price_lte=10 |

* you can add several filter conditions using the `&` operator.

### Count
```
https://mySite.com/api/products?price_gte=10&__action=count
```
returns:
```JSON
{
  "count": 4
}
```

## Paginate
By default the page size is 100 rows.
```
https://mySite.com/api/products?_limit=25
```
```
https://mySite.com/api/products?_limit=5&_page=3
```

:::tip
You can use it all in conjunction:
```
https://mySite.com/api/products?price_gte=5&price_lte=10&_sort=price&_order=desc&_limit=5&_page=3
```
:::
