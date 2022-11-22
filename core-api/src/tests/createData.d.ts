import { Status } from './testModel/models';
import { Remult } from '../context';
import { CategoriesForTesting } from './remult-3-entities';
import { Repository } from '../remult3';
export declare function createData(doInsert?: (insert: (id: number, name: string, description?: string, status?: Status) => Promise<void>) => Promise<void>, entity?: {
    new (): CategoriesForTesting;
}): Promise<[Repository<CategoriesForTesting>, Remult]>;
