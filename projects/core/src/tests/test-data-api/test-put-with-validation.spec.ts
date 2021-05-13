import { itAsync, Done, fitAsync } from "../testHelper.spec";
import { createDataOld, CategoriesForTestingOld, createData } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';


import { StatusColumn } from '../testModel/models';
import { Context } from '../../context';

import { Categories } from "../remult-3-entities";
import { Entity } from "../../remult3";




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
        expect(x[0].categoryName).toBe('noam');

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

@Entity<CategoriesForThisTest>({
    name: undefined,
    allowApiUpdate: true,
    allowApiInsert: true,
    extends:Categories,
    saving: (t) => {
        if (t.categoryName.indexOf('1') >= 0)
            t._.columns.categoryName.error = 'invalid'
    }
})
class CategoriesForThisTest extends Categories {
    
   


}