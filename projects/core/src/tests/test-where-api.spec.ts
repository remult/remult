import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { ComparisonFilterFactory, ContainsFilterFactory, Entity, EntityBase, EntityWhere, Field, FilterFactories, FindOptions, Repository } from '../remult3';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Context } from 'vm';
import { CustomFilterBuilder, customUrlToken, Filter } from '../filter/filter-interfaces';
import { RestDataProvider } from '../data-providers/rest-data-provider';
import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider';
import { ClassType } from '../../classType';
import { CustomSqlFilterBuilder } from '../filter/filter-consumer-bridge-to-sql-request';


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
        expect(await (c.count(e => entityForCustomFilter.filter.build({ oneAndThree: true }))))
            .toBe(2);
    });
    itAsync("test that it works with sql", async () => {
        let w = new WebSqlDataProvider("testWithFilter");

        let c = new ServerContext(new SqlDatabase(w)).for(entityForCustomFilter);
        w.dropTable(c.metadata);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => SqlDatabase.customFilter(x => x.sql = e.id.metadata.dbName + ' in (' + x.addParameterAndReturnSqlToken(1) + "," + x.addParameterAndReturnSqlToken(3, c.metadata.fields.id) + ")"))))
            .toBe(2);
        expect(await (c.count(e => entityForCustomFilter.filter.build({ dbOneOrThree: true })))).toBe(2);
    });
    itAsync("test that it works with arrayFilter", async () => {


        let c = new ServerContext(new InMemoryDataProvider()).for(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => ArrayEntityDataProvider.customFilter(x => x.id == 1 || x.id == 3))))
            .toBe(2);
        expect(await (c.count(e => entityForCustomFilter.filter.build({ dbOneOrThree: true })))).toBe(2);

    });
    itAsync("test or and promise in translate", async () => {
        let c = new ServerContext(new InMemoryDataProvider()).for(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => e.id.isEqualTo(4).or(entityForCustomFilter.filter.build({ dbOneOrThree: true }))))).toBe(3);
    });
    itAsync("test sent in api", async () => {
        let ok = new Done();
        let z = new RestDataProvider("", {
            delete: undefined,
            get: async (url) => {
                ok.ok();
                expect(url).toBe('/entityForCustomFilter?__action=count&_%24custom=%7B%22oneAndThree%22%3Atrue%7D');
                return { count: 0 }

            },
            post: undefined,
            put: undefined
        });
        let c = new ServerContext(z);
        await c.for(entityForCustomFilter).count(e => entityForCustomFilter.filter.build({ oneAndThree: true }));
        ok.test();
    });
    itAsync("test that api reads custom correctly", async () => {
        let context = new ServerContext(new InMemoryDataProvider());
        let c = context.for(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, context);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(2);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return "{\"oneAndThree\":true}";
                return undefined;
            }, clientIp: '', user: undefined, getHeader: x => ""
            , getBaseUrl: () => ''
        });
        d.test();
    });
    itAsync("test that api reads custom correctly and translates to db", async () => {
        let context = new ServerContext(new InMemoryDataProvider());
        let c = context.for(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, context);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(2);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return "{\"dbOneOrThree\":true}";
                return undefined;
            }, clientIp: '', user: undefined, getHeader: x => ""
            , getBaseUrl: () => ''
        });
        d.test();
    });
});


@Entity({
    key: 'entityForCustomFilter',
    customFilterTranslator: entityForCustomFilter.filter
})
class entityForCustomFilter extends EntityBase {
    @Field()
    id: number;
    static filter = new CustomFilterBuilder<entityForCustomFilter, {
        oneAndThree?: boolean,
        dbOneOrThree?: boolean
    }>(async (e, c) => {
        if (c.oneAndThree)
            return e.id.isIn([1, 3]);
        if (c.dbOneOrThree) {

            return SqlDatabase.customFilter(x => x.sql = e.id.metadata.dbName + ' in (' + x.addParameterAndReturnSqlToken(1) + "," + x.addParameterAndReturnSqlToken(3) + ")").and(
                ArrayEntityDataProvider.customFilter(x => x.id == 1 || x.id == 3)
            )
        }
    });
}


declare type filterFunction<customFilterType> = (args: customFilterType) => Filter;
export interface customFilterTranslator<customerFilterType> extends filterFunction<customerFilterType> {
    translateFilter: (customerFilterType: customerFilterType) => Filter;
}

let x: customFilterTranslator<{ oneOrThree: true }>;


function CustomFilterBuilderBuilder<entityType, customFilterObject = any>(translateFilter: (entityType: FilterFactories<entityType>, customFilter: customFilterObject) => Filter): customFilterTranslator<customFilterObject> {
    return undefined;
}

