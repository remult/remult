import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { EntityWhere, FindOptions, Repository } from '../remult3';


describe("test where stuff", () => {

    let repo: Repository<CategoriesForTesting>;
    beforeAll(async done => {
        repo = await insertFourRows();
        done();
    });

    fitAsync("test basics", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };

        //expect(await repo.count([y => y.id.isLessOrEqualTo(3), fo.where])).toBe(2);
        expect(await repo.count(y => y.id.isLessOrEqualTo(3).and(
            repo.translateWhereToFilter(fo.where)
        ))).toBe(2);

    });


});

// *********************************************

// ***** only supported in Typescript 3.7  *****

//********************************************** */
// let a: hasWhere<theClass> = {
//     where: x => x.a.isEqualTo(1)
// }
// let b: hasWhere<theClass> = {
//     where: [x => x.a.isEqualTo(2), a.where]
// }
// class theClass {
//     a: number;
//     b: number;
// }

// export declare type EntityWhereItem<entityType> = ((entityType: filterOf<entityType>) => (Filter | Filter[]));
// export declare type EntityWhere<entityType> = ((entityType: filterOf<entityType>) => (Filter | Filter[])) | EntityWhereItem<entityType>[];

// export interface hasWhere<T> {
//     where: EntityWhere<T>;
// }