import { IdEntity, Field, Entity } from 'remult';

@Entity('Products', {
    allowApiCrud: true
})
export class Product extends IdEntity {
    @Field()
    name: string = '';
}