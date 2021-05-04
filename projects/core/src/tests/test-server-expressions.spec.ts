import { itAsync } from './testHelper.spec';
import { ServerContext, EntityClass } from '../context';
import { Entity } from '../entity';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { NumberColumn } from '../columns/number-column';



describe("test server expression value", async () => {
    itAsync("test basics create", async () => {
        
        let c = new ServerContext(new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for_old(testServerExpression).create();
        r.code.value = 5;
        await r.save();
        expect(r.test.value).toBe(1);
        expect(r.testPromise.value).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    itAsync("test basics find", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for_old(testServerExpression).create();
        r.code.value = 5;
        await r.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.for_old(testServerExpression).find({}))[0];
        expect(r.test.value).toBe(1);
        expect(r.testPromise.value).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    itAsync("test doesnt calc on client", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        (<any>c)._onServer = false;
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for_old(testServerExpression).create();
        r.code.value = 5;
        await r.save();
        expect(r.test.value).toBe(undefined);
        expect(r.testPromise.value).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });
    itAsync("test basics find doesnt calc on client", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        (<any>c)._onServer = false;
        
        let r = c.for_old(testServerExpression).create();
        r.code.value = 5;
        await r.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.for_old(testServerExpression).find({}))[0];
        expect(r.test.value).toBe(undefined);
        expect(r.testPromise.value).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });



});

@EntityClass
class testServerExpression extends Entity<number>{
    static testVal = 1;
    static testVal2 = 10;
    code = new NumberColumn();
    test = new NumberColumn({ serverExpression: () => testServerExpression.testVal++ });
    testPromise = new NumberColumn({ serverExpression: () => Promise.resolve(testServerExpression.testVal2++) });
    constructor() {
        super();
    }
}