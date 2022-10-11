import { Remult } from '../context';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Field, Entity, EntityBase, Fields } from '../remult3';
import { actionInfo } from '../server-action';



describe("test server expression value", () => {
    beforeEach(() => actionInfo.runningOnServer = true);
    afterEach(() => actionInfo.runningOnServer = false);
    it("test basics create", async () => {

        let c = new Remult();
        c.dataProvider = (new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.repo(testServerExpression).create();
        r.code = 5;
        await r._.save();
        expect(r.test).toBe(1);
        expect(r.testPromise).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    it("test basics find", async () => {
        let c = new Remult();
        c.dataProvider = (new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.repo(testServerExpression).create();
        r.code = 5;
        await r._.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.repo(testServerExpression).find({}))[0];
        expect(r.test).toBe(1);
        expect(r.testPromise).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    it("test doesnt calc on client", async () => {
        actionInfo.runningOnServer = false;
        let c = new Remult();
        c.dataProvider = (new InMemoryDataProvider());

        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.repo(testServerExpression).create();
        r.code = 5;
        await r._.save();
        expect(r.test).toBe(undefined);
        expect(r.testPromise).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });
    it("test basics find doesnt calc on client", async () => {
        actionInfo.runningOnServer = false;
        let c = new Remult();
        c.dataProvider = (new InMemoryDataProvider());

        let r = c.repo(testServerExpression).create();
        r.code = 5;
        await r._.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.repo(testServerExpression).find({}))[0];
        expect(r.test).toBe(undefined);
        expect(r.testPromise).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });




});

@Entity('testServerExpression')
class testServerExpression extends EntityBase {
    static testVal = 1;
    static testVal2 = 10;
    @Fields.integer()
    code: number;
    @Fields.integer({ serverExpression: () => testServerExpression.testVal++ })
    test: number;
    @Fields.integer({ serverExpression: () => Promise.resolve(testServerExpression.testVal2++) })
    testPromise: number;
}
