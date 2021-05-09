import { Column, Entity } from "../remult3";
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

@Entity({
    name: 'Categories',
    allowApiCRUD: true
})
export class Categories {
    @Column({
        dbName: 'CategoryID'
    })
    id: Number;
    @Column()
    categoryName: string;
    @Column()
    description;
    @Column<Categories, Number>({
        serverExpression1: c => c.categoryName ? c.categoryName.length : undefined
    })
    categoryNameLength: number;
    @Column<Categories, number>({
        serverExpression1: (c) => Promise.resolve(c.categoryName ? c.categoryName.length : undefined)
    })
    categoryNameLengthAsync: number;
    @Column()
    status: Status;
}