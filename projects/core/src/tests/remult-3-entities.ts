import { EntityBase, Field, Entity, Repository, Fields } from "../remult3";
import { Status } from "./testModel/models";

@Entity('Products')
export class Products {
    @Fields.Integer()
    id: number;
    @Fields.String()
    name: string;
    @Fields.Number()
    price: number;
    @Fields.Boolean()
    archived: boolean;
    @Fields.Date()
    availableFrom: Date;
}

export interface CategoriesForTesting extends EntityBase {
    id: number;
    categoryName: string;
    description: string;
    status: Status;
}
let r: Repository<CategoriesForTesting>;

@Entity('Categories', {
    allowApiCrud: true
})
export class Categories extends EntityBase {
    @Fields.Number({
        dbName: 'CategoryID'
    })
    id: number = 0;
    @Fields.String({ allowNull: true })
    categoryName: string;
    @Fields.String()
    description: string;
    @Fields.Number<Categories>({
        serverExpression: c => c.categoryName ? c.categoryName.length : undefined
    })
    categoryNameLength: number;
    @Fields.Number<Categories>({
        serverExpression: (c) => Promise.resolve(c.categoryName ? c.categoryName.length : undefined)
    })
    categoryNameLengthAsync: number;
    @Field(() => Status)
    status: Status;
}