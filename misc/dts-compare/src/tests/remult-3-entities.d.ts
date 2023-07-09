import { EntityBase } from '../remult3';
import { Status } from './testModel/models';
export declare class Products {
    id: number;
    name: string;
    price: number;
    archived: boolean;
    availableFrom: Date;
}
export interface CategoriesForTesting extends EntityBase {
    id: number;
    categoryName: string;
    description: string;
    status: Status;
}
export declare class Categories extends EntityBase {
    id: number;
    categoryName: string;
    description: string;
    categoryNameLength: number;
    categoryNameLengthAsync: number;
    status: Status;
}
