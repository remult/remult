import { itAsync, Done } from "../testHelper.spec";
import { createData, CategoriesForTesting } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';
import { Entity } from '../../entity';
import { NumberColumn } from '../../columns/number-column';
import { StringColumn } from '../../columns/string-column';
import { StatusColumn } from '../testModel/models';
import { Context } from '../../context';
import { ValueListColumn } from '../../columns/value-list-column';
import { ColumnOptions } from '../../column-interfaces';



describe("data api", () => {
    let context = new Context();
    itAsync("put with validations fails", async () => {

        let c = await createData(async insert => insert(1, 'noam'), CategoriesForThisTest);

        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.error = async (data: any) => {

            expect(data.modelState.categoryName).toBe('invalid');
            d.ok();
        };
        await api.put(t, 1, {
            categoryName: 'noam 1'
        });
        d.test();
        var x = await c.find({ where: c => c.id.isEqualTo(1) });
        expect(x[0].categoryName.value).toBe('noam');

    });
    itAsync("post with validation fails", async () => {


        let c = await createData(async () => { }, CategoriesForThisTest);

        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.error = async (data: any) => {
            expect(data.modelState.categoryName).toBe('invalid');
            d.ok();
        };
        await api.post(t, { id: 1, categoryName: 'noam 1' });
        d.test();
        expect((await c.find()).length).toBe(0);
    });
    it("test value list type",()=>{
        let x = new StatusColumn();
        expect(x.info.isNumeric).toBe(true);
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
            allowApiUpdate: true,
            allowApiInsert: true,
            saving: () => {
                if (this.categoryName.value.indexOf('1') >= 0)
                    this.categoryName.validationError = 'invalid'
            }
        });
    }


}