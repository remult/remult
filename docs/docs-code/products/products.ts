import { IdEntity, Field, Entity } from 'remult';

@Entity('Products', {
    allowApiCrud: true
})
export class Products extends IdEntity {
    @Field()
    name: string;
}