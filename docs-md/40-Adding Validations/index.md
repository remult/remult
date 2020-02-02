To validate that there is a price for the product, we'll define the `onValidate` event for the price column
```csdiff
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
-   price = new NumberColumn();
+   price = new NumberColumn({
+       validate:()=>{
+           if (!this.price.value){
+               this.price.error = 'Price is required';
+           }
+       }
+   });
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

Let's review:
1. On line 7 we're sending the settings object to the constructor of `NumberColumn`. 
2. On line 8 we've set the `onValidate` event of the `price` column to the logic that we want.
3. On line 10, we specify the error. This error is later displayed to the user.

![](2019-10-06_14h33_33.png)

Note that the same validation logic will run both on the client (the browser) and on the server.
If you'll try to do the same update via an external tool you'll get an http status code of `400 Bad Request` and you'll see the following json result:
```
{
    "modelState": {
        "price": "Price is required"
    }
}
```

Let's add some more validations:
```csdiff
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn({
        validate: () => {
            if (!this.price.value) {
                this.price.error = 'Price is required';
            }
        }
    });
-   availableFrom = new DateColumn();
+   availableFrom = new DateColumn({
+       validate: () => {
+           if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
+               this.availableFrom.error = 'Invalid Date';
+       }
+   });
-   availableTo = new DateColumn();
+   availableTo = new DateColumn({
+       validate:() =>{
+           if (!this.availableTo.value||this.availableTo.value<=this.availableFrom.value){
+               this.availableTo.error='Should be greater than '+this.availableFrom.caption;
+           }
+       }
+   });
    constructor() {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```

The error would look like this:
![](2019-10-06_14h42_16.png)

And in the JSON response:
```
{
    "modelState": {
        "price": "Price is required",
        "availableFrom": "Invalid Date",
        "availableTo": "Should be greater than Avaiable From"
    }
}
```

> the fact that these validations are defined on the Entity level, means that this validation will happen anywhere values are set to this entity, through out the application code.

**Make sure to adjust your values to match the validation, otherwise, later in this tutorial steps may fail**