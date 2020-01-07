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
    itAsync("get based on id with excluded columns", async () => {
        let context = new Context();

        let c = await createData(async insert => insert(1, 'noam'), CategoryWithExcludeColumns);

        var api = new DataApi(c, c.create()._getEntityApiSettings(context));
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = async (data: any) => {
            expect(data.id).toBe(1);
            expect(data.categoryName).toBe(undefined);

            d.ok();
        };
        await api.get(t, 1)
        d.test();

    });
});

export class CategoryWithExcludeColumns extends Entity<number> implements CategoriesForTesting {
    id = new NumberColumn();
    categoryName = new StringColumn({ includeInApi: false });
    description = new StringColumn();
    status = new StatusColumn();


}