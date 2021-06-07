import { Field, Entity, IdEntity } from '@remult/core';

@Entity({
    key: "Categories",
    allowApiCrud: true,
})
export class Categories extends IdEntity {
    @Field()
    name: string;
}