import { ActionTestConfig, testAsIfOnBackend } from './testHelper.spec';
import { Remult, isBackend } from '../context';
import { prepareArgsToSend, Controller, BackendMethod } from '../server-action';
import { Field, Entity, getFields, ValueListFieldType, Fields } from '../remult3';

import { IdEntity } from '../id-entity';
import { remult } from '../remult-proxy';


@ValueListFieldType()
export class myType {
    static x = new myType((n) => 'x' + n);
    static y = new myType((n) => 'y' + n);
    id: any;
    constructor(public what: (n: number) => string) {

    }
}
@Entity('testEntity')
class testEntity extends IdEntity {
    @Fields.string()
    name: string;
    @BackendMethod({ allowed: false })
    async forbidden() {

    }
}

@Controller('1')
class testBasics {
    constructor(private remult: Remult) {

    }

    @Fields.date()
    theDate: Date;
    @Field(() => myType)
    myType: myType;
    @Field(() => testEntity)
    myEntity: testEntity;
    @BackendMethod({ allowed: true })
    async testDate() {

        return this.theDate.getFullYear();
    }
    @BackendMethod({ allowed: true })
    async testDataType(n: number) {
        return this.myType.what(n);
    }
    @BackendMethod({ allowed: false })
    async forbidden() {

    }

    @BackendMethod({ allowed: true })
    async sendEntityAsParamter() {
        return this.myEntity.name;
    }

    static test: string;
    @Fields.string<testBasics>({
        validate: (y, x) => {
            if (y.a == "errorc") {
                x.error = "error on client";
            }
            else if (y.a == "error on server" && isBackend()) {
                x.error = "error on server";
            }
        }
    })
    a: string;
    @BackendMethod({ allowed: true })
    async doIt() {
        let result = 'hello ' + this.a;
        this.a = 'yael';
        return {
            onServer: isBackend(),
            result
        }
    }
    @BackendMethod({ allowed: true })
    static async sf(name: string, remult?: Remult) {
        return {
            onServer: isBackend(),
            result: 'hello ' + name
        }
    }
    @BackendMethod({ allowed: true })
    static async testDate(d: Date) {

        return d.getFullYear();
    }
    @BackendMethod({ allowed: false })
    static async testForbidden2() {

    }
    @BackendMethod({ allowed: true })
    static async testDataType(d: myType, n: number) {
        return d.what(n);
    }
    @BackendMethod({ allowed: true })
    static async getValFromServer(remult?: Remult) {
        return (await remult.repo(testEntity).findFirst()).name;
    }
    @BackendMethod({ allowed: true })
    static async sendEntityAsParamter(entity: testEntity) {
        if (entity === null)
            return "null";
        return entity.name;
    }
    @BackendMethod({ allowed: true })
    static async syntaxError() {
        let z = undefined;
        return z.toString();
    }
    @BackendMethod({ allowed: true })
    async syntaxError() {
        let z = undefined;
        return z.toString();
    }
}
class Stam {
    @BackendMethod({ allowed: false })
    static async testForbidden1() {
        console.log("I am in forbidden");
    }
}


describe("test Server Controller basics", () => {
    let c = new Remult();
    c.dataProvider = (ActionTestConfig.db);
    beforeEach(async done => {

        await Promise.all((await c.repo(testEntity).find()).map(x => x.delete()));
        done();
    });
    it("forbidden static backend", async () => {
        let ok = true;
        try {
            await Stam.testForbidden1();
            ok = false;
        }
        catch (err: any) {
            expect(err.httpStatusCode).toBe(403);
        }
        expect(ok).toBe(true)
    });

    it("forbidden static backend", async () => {
        let ok = true;
        try {
            await testBasics.testForbidden2();
            ok = false;
        }
        catch (err: any) {
            expect(err.httpStatusCode).toBe(403);
        }
        expect(ok).toBe(true)
    });
    it("forbidden static backend", async () => {
        let ok = true;
        try {
            await testBasics.testForbidden2();
            ok = false;
        }
        catch (err: any) {
            expect(err.httpStatusCode).toBe(403);
        }
        expect(ok).toBe(true)
    });
    it("forbidden backend", async () => {
        let ok = true;
        try {
            await new testBasics(c).forbidden();
            ok = false;
        }
        catch (err: any) {
            expect(err.httpStatusCode).toBe(403);
        }
        expect(ok).toBe(true)
    });
    it("forbidden entity", async () => {
        let ok = true;
        try {
            await remult.repo(testEntity).create().forbidden();
            ok = false;
        }
        catch (err: any) {
            expect(err.httpStatusCode).toBe(403);
        }
        expect(ok).toBe(true)
    });

    it("test error", async () => {
        try {
            await testBasics.syntaxError();
        }
        catch (err) {
            expect(err.message).toContain("Cannot read prop")
        }
    });
    it("test error server method", async () => {
        try {
            await new testBasics(c).syntaxError();
        }
        catch (err) {
            expect(err.message).toContain("Cannot read prop")
        }
    });
    it("send entity to server ", async () => {
        let e = await c.repo(testEntity).create({ name: 'test' }).save();
        expect(await testBasics.sendEntityAsParamter(e)).toBe('test');
    });
    it("send entity to server ", async () => {

        expect(await testBasics.sendEntityAsParamter(null)).toBe('null');
    });

    it("send entity to server prepare args to send ", async () => {
        let e = await c.repo(testEntity).create({ name: 'test' }).save();
        expect(prepareArgsToSend([testEntity], [e])[0]).toBe(e.id);
    });
    it("data is saved on server", async () => {
        await c.repo(testEntity).create({ name: 'test' }).save();
        expect(await testBasics.getValFromServer()).toBe('test');
    });
    it("test backend method caller", async () => {
        const c = new Remult({
            url: "xx", httpClient: {
                delete: () => undefined,
                get: () => undefined,
                post: async (url, data) => {
                    expect(url).toBe("xx/sf");
                    expect(data.args[0]).toEqual("noam");
                    return { data: { result: "hello noam" } };
                },
                put: () => undefined
            }
        });
        const r = (await c.call(testBasics.sf, undefined, "noam"));
        console.log(r);
        expect(r.result).toBe("hello noam");
    });
    it("test backend method instance method", async () => {
        const c = new Remult({
            url: "xx", httpClient: {
                delete: () => undefined,
                get: () => undefined,
                post: async (url, data) => {
                    expect(url).toBe("xx/1/doIt");
                    return { result: { result: "hello noam" }, fields: {} };
                },
                put: () => undefined
            }
        });
        const b = new testBasics(remult);
        const r = (await c.call(b.doIt, b));
        console.log(r);
        expect(r.result).toBe("hello noam");
    });
    it("test server function", async () => {

        let r = await testBasics.sf("noam");
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello noam');
    });
    it("test server function on server", async () => {
        await testAsIfOnBackend(async () => {
            let r = await testBasics.sf("noam");
            expect(r.onServer).toBe(true);
            expect(r.result).toBe('hello noam');
        });
    });
    it("test server Method Date", async () => {
        let tb = new testBasics(c);
        tb.theDate = new Date(1976, 6, 16);
        expect(await tb.testDate()).toBe(1976);
    });
    it("test server Method Date on server", async () => {
        let tb = new testBasics(c);
        tb.theDate = new Date(1976, 6, 16);
        await testAsIfOnBackend(async () => {
            expect(await tb.testDate()).toBe(1976)
        });
    });
    it("test server Method myType", async () => {
        let tb = new testBasics(c);
        tb.myType = myType.y;
        expect(await tb.testDataType(7)).toBe('y7');
    });
    it("test server method entity", async () => {
        let e = await c.repo(testEntity).create({ name: 'test3' }).save();
        let tb = new testBasics(c);
        tb.myEntity = e;
        expect(await tb.sendEntityAsParamter()).toBe('test3');
    });
    it("test server function Date", async () => {
        let r = await testBasics.testDate(new Date(1976, 6, 16));
        expect(r).toBe(1976);
    });
    it("test server function custom type", async () => {
        let r = await testBasics.testDataType(myType.y, 2);
        expect(r).toBe('y2');
    });
    it("test server method", async () => {

        let x = new testBasics(new Remult());
        x.a = 'Noam';
        let r = await x.doIt();
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello Noam');
        expect(x.a).toBe("yael");
    });
    it("test validation method", async () => {
        let x = new testBasics(new Remult());
        x.a = 'errorc';
        let happened = false;
        try {
            let r = await x.doIt();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on client");
            expect(getFields(x).a.error).toBe("error on client");
        }
        expect(happened).toBe(false);


    });
    it("test validation on server", async () => {
        let x = new testBasics(new Remult());
        x.a = "error on server";
        let happened = false;
        try {
            let r = await x.doIt();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on server");
            expect(getFields(x).a.error).toBe("error on server");
        }
        expect(happened).toBe(false);


    });

});
describe("controller with extends ", () => {
    it("test inheritance in controllers", async () => {
        let c = new child()
        c.childField = 'c';
        c.parentField = 'p';
        let r = await c.run();
        expect(r.c).toBe('c');
        expect(r.p).toBe('p');
    });
});


@Controller("parent")
class parent {
    @Fields.string()
    parentField: string;
}
@Controller("child")
class child extends parent {
    @Fields.string()
    childField: string;

    @BackendMethod({ allowed: true })
    run() {
        return { p: this.parentField, c: this.childField };
    }
}