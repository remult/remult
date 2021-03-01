import { IdEntity, StringColumn, EntityClass } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD:true,
            allowApiRead:true
        });
    }
}