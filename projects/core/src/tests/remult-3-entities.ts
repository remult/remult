import { GridSettings } from "../../../angular";
import { EntityBase, Column, Entity, Repository } from "../remult3";
import { Status } from "./testModel/models";

@Entity({
    key: 'Products'
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
let r :Repository<CategoriesForTesting>;

@Entity({
    key: 'Categories',
    allowApiCrud: true
})
export class Categories extends EntityBase {
    @Column({
        dbName: 'CategoryID'
    })
    id: number = 0;
    @Column()
    categoryName: string;
    @Column()
    description: string;
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