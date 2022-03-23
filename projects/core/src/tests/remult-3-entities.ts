import { EntityBase, Field, Entity, Repository, IntegerField, StringField, NumberField, BooleanField, DateField } from "../remult3";
import { Status } from "./testModel/models";

@Entity('Products')
export class Products {
    @IntegerField()
    id: number;
    @StringField()
    name: string;
    @NumberField()
    price: number;
    @BooleanField()
    archived: boolean;
    @DateField()
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
    @NumberField({
        dbName: 'CategoryID'
    })
    id: number = 0;
    @StringField({ allowNull: true })
    categoryName: string;
    @StringField()
    description: string;
    @NumberField<Categories>({
        serverExpression: c => c.categoryName ? c.categoryName.length : undefined
    })
    categoryNameLength: number;
    @NumberField<Categories>({
        serverExpression: (c) => Promise.resolve(c.categoryName ? c.categoryName.length : undefined)
    })
    categoryNameLengthAsync: number;
    @Field(() => Status)
    status: Status;
}