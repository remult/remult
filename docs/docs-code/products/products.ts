import { IdEntity, Field, Entity } from '@remult/core';

@Entity({
    key: 'Products',
    allowApiCrud: true
})
export class Products extends IdEntity {
    @Field()
    name: string;
}