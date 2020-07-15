We can use the `GridSettings` `onEnterRow` property to define a function that will be run when ever a row is entered, and set the defaults for a new row there.
In the `products.ts`
```csdiff
import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn(
        {
            validate: () => {
                if (!this.price.value) {
                    this.price.validationError = 'Price is required';
                }
            }
        }
    );
    availableFrom = new DateColumn({
        validate: () => {
            if (!this.availableFrom.value || this.availableFrom.value.getFullYear() < 1990)
                this.availableFrom.validationError = 'Invalid Date';
        }
+       , defaultValue: () => new Date()
    });
    availableTo = new DateColumn({
        validate: () => {
            if (!this.availableTo.value || this.availableTo.value <= this.availableFrom.value) {
                this.availableTo.validationError = 'Should be greater than ' + this.availableFrom.defs.caption;
            }
        }
+       , defaultValue: () => new Date(9999, 11, 31)
    });
    constructor() {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
} 
```
> note that in javascript dates, the months are from 0 to 11, that is why `new Date(9999,11,31)` is the end of the year 9999

