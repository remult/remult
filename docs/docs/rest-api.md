# Entity Rest Api Breakdown

All entities automatically expose a rest API based on the parameters defined in its decorator.

The API supports the following actions (we'll use the `products` entity as an example, and a specific product with an id=7):

| Http Method | Description                                                                         | example         | requires       |
| ----------- | ----------------------------------------------------------------------------------- | --------------- | -------------- |
| GET         | returns an array of rows                                                            | /api/products   | allowApiRead   |
| GET         | returns a single row based on its id                                                | /api/products/7 | allowApiRead   |
| POST        | creates a new row based on the object sent in the body, and returns the new row     | /api/products   | allowApiInsert |
| PUT         | updates an existing row based on the object sent in the body and returns the result | /api/products/7 | allowApiUpdate |
| DELETE      | deletes an existing row                                                             | /api/products/7 | allowApiDelete |

## Sort

Add \_sort and \_order (ascending order by default)

```
https://mySite.com/api/products?_sort=price&_order=desc
```

## Filter

You can filter the rows using different operators

```
https://mySite.com/api/products?price.gte=5&price.lte=10
```

## Select

Use `_select` with a comma separated list of the fields you would like to select

### Filter Operators

| operator     | description           | example                                            |
| ------------ | --------------------- | -------------------------------------------------- |
| `none`       | Equal To              | price=10                                           |
| .ne          | Not Equal             | price.ne=10                                        |
| .in          | is in json array      | price.in=%5B10%2C20%5D _(url encoded - `[10,20]`)_ |
| .contains    | Contains a string     | name.contains=ee                                   |
| .notContains | Not contains a string | name.notContains=ee                                |
| .startsWith  | Starts with a string  | name.startsWith=ee                                 |
| .endsWith    | Ends with a string    | name.endsWith=ee                                   |
| .gt          | Greater than          | price.gt=10                                        |
| .gte         | Greater than or equal | price.gte=10                                       |
| .lt          | Lesser than           | price.lt=10                                        |
| .lte         | Lesser than or equal  | price.lte=10                                       |
| .null        | is or is not null     | price.null=true                                    |

- you can add several filter conditions using the `&` operator.

### Count

```
https://mySite.com/api/products?price.gte=10&__action=count
```

returns:

```JSON
{
  "count": 4
}
```

## Paginate

The default page size is 100 rows.

```
https://mySite.com/api/products?_limit=25
```

```
https://mySite.com/api/products?_limit=5&_page=3
```

:::tip
You can use it all in conjunction:

```
https://mySite.com/api/products?price.gte=5&price.lte=10&_sort=price&_order=desc&_limit=5&_page=3
```

:::
