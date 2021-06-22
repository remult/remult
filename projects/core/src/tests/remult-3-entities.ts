import { EntityBase, Field, Entity, Repository } from "../remult3";
import { Status } from "./testModel/models";

@Entity({
    key: 'Products'
})
export class Products {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    price: number;
    @Field()
    archived: boolean;
    @Field()
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
    @Field({
        dbName: 'CategoryID'
    })
    id: number = 0;
    @Field()
    categoryName: string;
    @Field()
    description: string;
    @Field<Categories, Number>({
        serverExpression: c => c.categoryName ? c.categoryName.length : undefined
    })
    categoryNameLength: number;
    @Field<Categories, number>({
        serverExpression: (c) => Promise.resolve(c.categoryName ? c.categoryName.length : undefined)
    })
    categoryNameLengthAsync: number;
    @Field()
    status: Status;
}