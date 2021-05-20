import { itAsync, Done, fitAsync } from "../testHelper.spec";
import { createData } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';
import { Context, ServerContext } from '../../context';
import { Categories } from "../remult-3-entities";
import { Column, Entity, EntityBase } from "../../remult3";
import { InMemoryDataProvider } from "../../..";
import { ValueListInfo } from "../../column";
import { Status } from "../testModel/models";

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
    itAsync("allow column update based on new row only", async () => {

        let type = class extends EntityBase {
            id: number;
            val: string;
        }
        Entity({ key: 'allowcolumnupdatetest', allowApiCrud: true })(type);
        Column({ dataType: Number })(type.prototype, 'id');
        Column<EntityBase, string>({
            dataType: String,
            allowApiUpdate: (c, x) => x._.isNew()
        })(type.prototype, 'val');
        let context = new ServerContext();
        context.setDataProvider(new InMemoryDataProvider());
        let c = context.for(type);

        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        t.success = () => { };
        t.created = () => { };
        let d = new Done();
        await api.post(t, {
            id: 1,
            val: 'noam'
        });
        await api.put(t, 1, {
            val: 'yael'
        });

        var x = await c.find({ where: c => c.id.isEqualTo(1) });
        expect(x[0].val).toBe('noam');

    });
    itAsync("allow column update based on specific value", async () => {

        let type = class extends EntityBase {
            id: number;
            val: string;
        }
        Entity({ key: 'allowcolumnupdatetest', allowApiCrud: true })(type);
        Column({ dataType: Number })(type.prototype, 'id');
        Column<typeof type.prototype, string>({
            dataType: String,
            allowApiUpdate: (c, x) => x.val != "yael"
        })(type.prototype, 'val');
        let context = new ServerContext();
        context.setDataProvider(new InMemoryDataProvider());
        let c = context.for(type);

        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        t.success = () => { };
        t.created = () => { };
        let d = new Done();
        await api.post(t, {
            id: 1,
            val: 'noam'
        });
        await api.put(t, 1, {
            val: 'yael'
        });
        var x = await c.find({ where: c => c.id.isEqualTo(1) });
        expect(x[0].val).toBe('yael');
        await api.put(t, 1, {
            val: 'yoni'
        });
        var x = await c.find({ where: c => c.id.isEqualTo(1) });
        expect(x[0].val).toBe('yael');

    });

     it("test value list type",()=>{
         let x = ValueListInfo.get(Status);
         expect(x.isNumeric).toBe(true);
     });

});

@Entity<CategoriesForThisTest>({
    key: undefined,
    allowApiUpdate: true,
    allowApiInsert: true,
    
    saving: (t) => {
        if (t.categoryName.indexOf('1') >= 0)
            t._.columns.categoryName.error = 'invalid'
    }
})
class CategoriesForThisTest extends Categories {




}