# FilterInfo
Represents information about a filter, including precise values for each property.
## preciseValues
A mapping of property names to arrays of precise values for those properties.
   
   
   #### example:
   ```ts
   const info = await Filter.getInfo(meta, {
     status: { $ne: 'active' },
     $or: [
       { customerId: ["1", "2"] },
       { customerId: "3" }
     ]
   });
   console.log(info.preciseValues);
   // Output:
   // {
   //   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
   //   "status": undefined,           // Cannot infer precise values for 'status'
   // }
   ```
