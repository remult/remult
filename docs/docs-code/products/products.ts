import { IdEntity, Field, Entity } from 'remult';

@Entity({
    key: 'Products',
    allowApiCrud: true
})
export class Products extends IdEntity {
    @Field()
    name: string;
}