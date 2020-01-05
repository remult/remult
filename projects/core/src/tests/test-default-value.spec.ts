import { itAsync } from './testHelper.spec';
import { ServerContext, EntityClass } from '../context';
import { Entity } from '../entity';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { NumberColumn } from '../columns/number-column';



describe("test default value", () => {

    itAsync("test basics", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        testDefaultValue.testVal = 1;
        let r = c.for(testDefaultValue).create();
        expect(r.test.value).toBe(1);
        expect(testDefaultValue.testVal).toBe(2);
    });
    itAsync("test create without querying the value", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        testDefaultValue.testVal = 1;
        let r = c.for(testDefaultValue).create();
        r.save();
        let res =await c.for(testDefaultValue).find({});
        expect(res.length).toBe(1);
        expect (testDefaultValue.testVal).toBe(2);
        expect(res[0].test.value).toBe(1);


    });
    it("supports just a column", () => {
        let i = 5;
        let nc = new NumberColumn({ defaultValue: () => i++ });
        expect(i).toBe(5);
        expect(nc.value).toBe(5);
        expect(i).toBe(6);
    });
    it("supports just a column with a function", () => {
        let nc = new NumberColumn({ defaultValue: () => 7 });
        expect(nc.value).toBe(7);
    });
    it("supports just a column without a function", () => {
        let nc = new NumberColumn({ defaultValue: 7 });
        expect(nc.value).toBe(7);
    });


});

@EntityClass
class testDefaultValue extends Entity<number>{
    static testVal = 0;
    code = new NumberColumn();
    test = new NumberColumn({ defaultValue: () => testDefaultValue.testVal++ });
}