We can use the `GridSettings` `onEnterRow` property to define a function that will be run when ever a row is entered, and set the defaults for a new row there.
In the `products.component.ts`
```csdiff
products = this.context.for(Products).gridSettings({
    allowInsert: true,
    allowUpdate: true,
    allowDelete: true,
    columnSettings: p => [
        p.name,
        {
        column: p.price,
        width: '75'
        },
        p.availableFrom,
        p.availableTo
    ]
    , numOfColumnsInGrid: 2
    , hideDataArea: true
+   ,onEnterRow:p=>{
+       if (p.isNew())
+       {
+       p.availableFrom.value = new Date();
+       p.availableTo.value = new Date(9999,11,31);
+       p.price.value = 5;
+       }
+   }
});
```
> note that in javascript dates, the months are from 0 to 12, that is why `new Date(9999,11,31)` is the end of the year 9999

