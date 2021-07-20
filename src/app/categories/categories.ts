import { Field, Entity, IdEntity } from 'remult';

@Entity({
    key: "Categories",
    allowApiCrud: true,
})
export class Categories extends IdEntity {
    @Field()
    name: string;
}