import { Field, Entity, IdEntity } from 'remult';

@Entity("Categories", {
    allowApiCrud: true,
})
export class Categories extends IdEntity {
    @Field()
    name: string;
}