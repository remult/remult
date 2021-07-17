import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { Entity, EntityBase, EntityWhere, Field, FilterFactories, FindOptions, Repository } from '../remult3';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Context } from 'vm';
import { CustomFilterBuilder, Filter } from '../filter/filter-interfaces';


describe("test where stuff", () => {

    let repo: Repository<CategoriesForTesting>;
    beforeAll(async done => {
        [repo] = await insertFourRows();
        done();
    });

    itAsync("test basics", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count([y => y.id.isLessOrEqualTo(3), fo.where])).toBe(2);
    });
    itAsync("test basics_2", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count([y => y.id.isLessOrEqualTo(3), () => fo.where, () => undefined])).toBe(2);
    });
    itAsync("test basics_3", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: [x => x.id.isGreaterOrEqualTo(2), undefined]
        };
        expect(await repo.count([y => y.id.isLessOrEqualTo(3), () => fo.where])).toBe(2);
    });


});

describe("custom filter", () => {
    itAsync("test that it works", async () => {
        let c = new ServerContext(new InMemoryDataProvider()).for(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => filter.build({ oneAndThree: true }))))
            .toBe(2);

    });
});
let filter = new CustomFilterBuilder<entityForCustomFilter, {
    oneAndThree: boolean
}>((e, c) => {
    if (c.oneAndThree)
        return e.id.isIn([1, 3]);
});

@Entity({
    key: 'entityForCustomFilter',
    customFilterTranslator: filter
})
class entityForCustomFilter extends EntityBase {
    @Field()
    id: number;
}


