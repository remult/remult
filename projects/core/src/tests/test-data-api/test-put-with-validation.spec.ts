import { itAsync, Done, fitAsync } from "../testHelper.spec";
import { createData } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';
import { Context } from '../../context';
import { Categories } from "../remult-3-entities";
import { Field, Entity, EntityBase } from "../../remult3";
import { InMemoryDataProvider } from "../../..";

import { Status } from "../testModel/models";
import { ValueListValueConverter } from "../../../valueConverters";


describe("data api", () => {

    itAsync("put with validations fails", async () => {

        let [c, context] = await createData(async insert => insert(1, 'noam'), CategoriesForThisTest);

        var api = new DataApi(c, context);
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


        let [c, context] = await createData(async () => { }, CategoriesForThisTest);

        var api = new DataApi(c, context);
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
        Field({ valueType: Number })(type.prototype, 'id');
        Field<EntityBase, string>({
            valueType: String,
            allowApiUpdate: (c, x) => x._.isNew()
        })(type.prototype, 'val');
        let context = new Context();
        context.setDataProvider(new InMemoryDataProvider());
        let c = context.for(type);

        var api = new DataApi(c, context);
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
        Field({ valueType: Number })(type.prototype, 'id');
        Field<typeof type.prototype, string>({
            valueType: String,
            allowApiUpdate: (c, x) => x.val != "yael"
        })(type.prototype, 'val');
        let context = new Context();
        context.setDataProvider(new InMemoryDataProvider());
        let c = context.for(type);

        var api = new DataApi(c, context);
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

    it("test value list type", () => {
        let x = new ValueListValueConverter(Status);
        expect(x.fieldTypeInDb).toBe("integer");
    });

});

@Entity<CategoriesForThisTest>({
    key: undefined,
    allowApiUpdate: true,
    allowApiInsert: true,

    saving: (t) => {
        if (t.categoryName.indexOf('1') >= 0)
            t._.fields.categoryName.error = 'invalid'
    }
})
class CategoriesForThisTest extends Categories {




}