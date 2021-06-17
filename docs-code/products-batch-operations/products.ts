import { IdEntity, Field, Entity, DateOnlyField } from '@remult/core';

@Entity({
    key: 'Products',
    allowApiCrud: true
})
export class Products extends IdEntity {
    @Field()
    name: string;
    @Field()
    price: number = 0;
    @DateOnlyField()
    availableFrom: Date;
    @DateOnlyField()
    availableTo: Date;
}