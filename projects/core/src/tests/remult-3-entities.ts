import { EntityBase, Column, Entity } from "../remult3";
import { Status } from "./testModel/models";

@Entity({
    name: 'Products'
})
export class Products {
    @Column()
    id: number;
    @Column()
    name: string;
    @Column()
    price: number;
    @Column()
    archived: boolean;
    @Column()
    availableFrom: Date;
}

export interface CategoriesForTesting extends EntityBase {
    id: number;
    categoryName: string;
    description: string;
    status: Status;
}
@Entity({
    name: 'Categories',
    allowApiCRUD: true
})
export class Categories extends EntityBase{
    @Column({
        dbName: 'CategoryID'
    })
    id: number;
    @Column()
    categoryName: string;
    @Column()
    description:string;
    @Column<Categories, Number>({
        serverExpression: c => c.categoryName ? c.categoryName.length : undefined
    })
    categoryNameLength: number;
    @Column<Categories, number>({
        serverExpression: (c) => Promise.resolve(c.categoryName ? c.categoryName.length : undefined)
    })
    categoryNameLengthAsync: number;
    @Column()
    status: Status;
}