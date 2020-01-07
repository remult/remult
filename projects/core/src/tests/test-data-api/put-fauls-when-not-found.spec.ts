import { itAsync, Done } from "../testHelper.spec";
import { createData, CategoriesForTesting } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';
import { Entity } from '../../entity';
import { NumberColumn } from '../../columns/number-column';
import { StringColumn } from '../../columns/string-column';
import { StatusColumn } from '../testModel/models';
import { Context } from '../../context';



describe("data api", () => {
    itAsync("put fails when not found", async () => {
        let context = new Context();

        let c = await createData(async insert => insert(1, 'noam'), CategoriesForThisTest);

        var api = new DataApi(c, c.create()._getEntityApiSettings(context));
        let t = new TestDataApiResponse();
        let d = new Done();
        t.notFound = () => d.ok();
        await api.put(t, 2, {});
        d.test();

    });
});

class CategoriesForThisTest extends Entity<number> implements CategoriesForTesting {
    id = new NumberColumn();
    categoryName = new StringColumn();
    description = new StringColumn();
    status = new StatusColumn();
    constructor() {
        super({
            name: undefined,
            allowApiUpdate: true
        });
    }


}