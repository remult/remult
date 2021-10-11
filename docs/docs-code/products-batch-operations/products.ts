import { IdEntity, Field, Entity, DateOnlyField } from 'remult';

@Entity('Products', {
    allowApiCrud: true
})
export class Product extends IdEntity {
    @Field()
    name: string = '';
    @Field()
    price: number = 0;
    @DateOnlyField()
    availableFrom?: Date;
    @DateOnlyField()
    availableTo?: Date;
}