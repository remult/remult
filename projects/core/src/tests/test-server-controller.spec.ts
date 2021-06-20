import { itAsync, Done, fitAsync, ActionTestConfig } from './testHelper.spec';
import { Context, ServerContext } from '../context';
import { prepareArgsToSend, prepareReceivedArgs, Controller,  BackendMethod, BackendMethodOptions } from '../server-action';
import { Field, Entity, getFields, FieldType, ValueListFieldType } from '../remult3';

import { IdEntity } from '../id-entity';


@ValueListFieldType(myType)
export class myType {
    static x = new myType((n) => 'x' + n);
    static y = new myType((n) => 'y' + n);
    id: any;
    constructor(public what: (n: number) => string) {

    }
}
@Entity({ key: 'testEntity' })
class testEntity extends IdEntity {
    @Field()
    name: string;
}

@Controller('1')
class testBasics {
    constructor(private context: Context) {

    }

    @Field()
    theDate: Date;
    @Field()
    myType: myType;
    @Field()
    myEntity: testEntity;
    @BackendMethod({ allowed: true })
    async testDate() {

        return this.theDate.getFullYear();
    }
    @BackendMethod({ allowed: true })
    async testDataType(n: number) {
        return this.myType.what(n);
    }

    @BackendMethod({ allowed: true })
    async sendEntityAsParamter() {
        return this.myEntity.name;
    }

    static test: string;
    @Field<testBasics, string>({
        validate: (y, x) => {
            if (y.a == "errorc") {
                x.error = "error on client";
            }
            else if (y.a == "error on server" && y.context.backend) {
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
            onServer: this.context.backend,
            result
        }
    }
    @BackendMethod({ allowed: true })
    static async sf(name: string, context?: Context) {
        return {
            onServer: context.backend,
            result: 'hello ' + name
        }
    }
    @BackendMethod({ allowed: true })
    static async testDate(d: Date) {

        return d.getFullYear();
    }
    @BackendMethod({ allowed: true })
    static async testDataType(d: myType, n: number) {
        return d.what(n);
    }
    @BackendMethod({ allowed: true })
    static async getValFromServer(context?: Context) {
        return (await context.for(testEntity).findFirst()).name;
    }
    @BackendMethod({ allowed: true })
    static async sendEntityAsParamter(entity: testEntity) {
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


describe("test Server Controller basics", () => {
    let c = new ServerContext(ActionTestConfig.db);
    beforeEach(async done => {

        await Promise.all((await c.for(testEntity).find()).map(x => x.delete()));
        done();
    });
    itAsync("test error", async () => {
        try {
            await testBasics.syntaxError();
        }
        catch (err) {
            expect(err.message).toBe("Cannot read property 'toString' of undefined")
        }
    });
    itAsync("test error server method", async () => {
        try {
            await new testBasics(c).syntaxError();
        }
        catch (err) {
            expect(err.message).toBe("Cannot read property 'toString' of undefined")
        }
    });
    itAsync("send entity to server ", async () => {
        let e = await c.for(testEntity).create({ name: 'test' }).save();
        expect(await testBasics.sendEntityAsParamter(e)).toBe('test');
    });
    itAsync("send entity to server prepare args to send ", async () => {
        let e = await c.for(testEntity).create({ name: 'test' }).save();
        expect(prepareArgsToSend([testEntity], [e])[0]).toBe(e.id);
    });
    itAsync("data is saved on server", async () => {
        await c.for(testEntity).create({ name: 'test' }).save();
        expect(await testBasics.getValFromServer()).toBe('test');
    });
    itAsync("test server function", async () => {

        let r = await testBasics.sf("noam");
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello noam');
    });
    itAsync("test server Method Date", async () => {
        let tb = new testBasics(c);
        tb.theDate = new Date(1976, 6, 16);
        expect(await tb.testDate()).toBe(1976);
    });
    itAsync("test server Method myType", async () => {
        let tb = new testBasics(c);
        tb.myType = myType.y;
        expect(await tb.testDataType(7)).toBe('y7');
    });
    itAsync("test server method entity", async () => {
        let e = await c.for(testEntity).create({ name: 'test3' }).save();
        let tb = new testBasics(c);
        tb.myEntity = e;
        expect(await tb.sendEntityAsParamter()).toBe('test3');
    });
    itAsync("test server function Date", async () => {
        let r = await testBasics.testDate(new Date(1976, 6, 16));
        expect(r).toBe(1976);
    });
    itAsync("test server function custom type", async () => {
        let r = await testBasics.testDataType(myType.y, 2);
        expect(r).toBe('y2');
    });
    itAsync("test server method", async () => {

        let x = new testBasics(new Context());
        x.a = 'Noam';
        let r = await x.doIt();
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello Noam');
        expect(x.a).toBe("yael");
    });
    itAsync("test validation method", async () => {
        let x = new testBasics(new Context());
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
    itAsync("test validation on server", async () => {
        let x = new testBasics(new Context());
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
