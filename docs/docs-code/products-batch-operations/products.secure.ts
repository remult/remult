import { IdEntity, StringColumn, EntityClass, NumberColumn, DateColumn } from '@remult/core';
import { Roles } from '../users/roles';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    price = new NumberColumn();
    availableFrom = new DateColumn();
    availableTo = new DateColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD:Roles.admin,
            allowApiRead:true
        });
    }
} 