import { IdEntity, StringColumn, EntityClass } from '@remult/core';

@EntityClass
export class Categories extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: "Categories",
            allowApiCRUD:true,
            allowApiRead:true
        });
    }
} 