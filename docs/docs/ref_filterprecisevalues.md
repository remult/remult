# FilterPreciseValues

A mapping of property names to arrays of precise values for those properties.

#### example:

```ts
const preciseValues = await getPreciseValues(meta, {
  status: { $ne: 'active' },
  $or: [{ customerId: ['1', '2'] }, { customerId: '3' }],
})
console.log(preciseValues)
// Output:
// {
//   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
//   "status": undefined,           // Cannot infer precise values for 'status'
// }
```
