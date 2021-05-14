import { Column, Entity, IdEntity } from '@remult/core';

@Entity({
    name: "Categories",
    allowApiCRUD: true,
})
export class Categories extends IdEntity {
    @Column()
    name: string;
}