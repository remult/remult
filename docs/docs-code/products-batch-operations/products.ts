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