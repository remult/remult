import { fitAsync, itAsync } from './testHelper.spec';
import { Context } from '../context';

import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { EntityBase, Entity, Field } from '../remult3';




describe("test default value", () => {

    itAsync("test basics", async () => {
        let c = new Context();
        c.setDataProvider(new InMemoryDataProvider());
        testDefaultValue.testVal = 1;
        let r = c.for(testDefaultValue).create();
        expect(r.test).toBe(1);
        expect(testDefaultValue.testVal).toBe(2);
    });
    itAsync("test create without querying the value", async () => {
        let c = new Context();
        c.setDataProvider(new InMemoryDataProvider());
        testDefaultValue.testVal = 1;
        let r = c.for(testDefaultValue).create();
        await r._.save();
        let res = await c.for(testDefaultValue).find({});
        expect(res.length).toBe(1);
        expect(testDefaultValue.testVal).toBe(2);
        expect(res[0].test).toBe(1);


    });





});

@Entity({ key: 'testDefaultValue' })
class testDefaultValue extends EntityBase {
    static testVal = 0;
    code: number;
    @Field({
        defaultValue: () => testDefaultValue.testVal++
    })
    test: number;
}