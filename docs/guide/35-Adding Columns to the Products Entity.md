# Adding More Columns
let's add a price, and availability dates to the `Products` entity

In the `products.ts` file
```ts{1,6-8}
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn();
    availableFrom = new DateColumn();
    availableTo = new DateColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD:true,
            allowApiRead:true
        });
    }
} 
```

Once we've added these columns we'll be able to see in the `node-serve` terminal window that these columns were added to our database:
```{12-14}
12:21:03 PM - File change detected. Starting incremental compilation...


12:21:03 PM - Found 0 errors. Watching for file changes.

> my-project@0.0.0 server:dev-run c:\try\test1\my-project
> node --inspect dist-server/server/server.js

Debugger listening on ws://127.0.0.1:9229/67e4d3a7-c829-4769-8ff0-f576726719a7
For help, see: https://nodejs.org/en/docs/inspector
start verify structure
alter table Products add column price int default 0 not null
alter table Products add column availableFrom date
alter table Products add column availableTo date
/api/signIn
/api/resetPassword
/api/Users
/api/Products
```

And when we'll look at the browser, we'll see that there are 3 more columns to the grid