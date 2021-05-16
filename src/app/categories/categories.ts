import { Column, Entity, IdEntity } from '@remult/core';

@Entity({
    key: "Categories",
    allowApiCrud: true,
})
export class Categories extends IdEntity {
    @Column()
    name: string;
}