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
    itAsync("post with syntax error fails well", async () => {
        let context = new Context();

        let c = await createData(async insert => , CategoriesForThisTest);

        var api = new DataApi(c, c.create()._getEntityApiSettings(context));
        let t = new TestDataApiResponse();
        let d = new Done();
        t.error = async (data: any) => {
          expect(data.message).toBe("Cannot read property 'length' of undefined");
          d.ok();
        };
        await api.post(t, { id: 1, categoryName: 'noam' });
        d.test();
        expect((await c.find()).length).toBe(0);

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
            allowApiInsert: true,
            savingRow:()=>this.description.value.length+1
        });
    }


}