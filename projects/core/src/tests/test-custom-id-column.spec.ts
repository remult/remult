import { ServerContext } from '../context';
import { itWithDataProvider } from './basicRowFunctionality.spec';
import { Field, Entity, EntityBase } from '../remult3';



describe("custom id column", () => {
    itWithDataProvider("basic test", async (dpf) => {
        let context = new ServerContext(dpf);
        let type = class extends EntityBase {
            a: number;
            b: number;
        }
        Entity({ key: 'custom' })(type);
        Field()(type.prototype, 'a');
        Field()(type.prototype, 'b');
        let c = context.for(type);
        let r = c.create();
        r.a = 1;
        r.b = 1;
        await r._.save();
        r = c.create();
        r.a = 2;
        r.b = 2;
        await r._.save();
        expect(c.defs.idField.key).toBe(c.defs.fields.a.key);


    });
    itWithDataProvider("basic test id column not first column", async (dpf) => {
        let context = new ServerContext(dpf);
        let type = class extends EntityBase {
            a: number;
            id: number;
        }
        Entity({ key: 'custom2' })(type);
        Field({ dataType: Number })(type.prototype, 'a');
        Field({ dataType: Number })(type.prototype, 'id');
        let c = context.for(type);
        let r = c.create();
        r.a = 1;
        r.id = 5;
        await r._.save();
        r = c.create();
        r.a = 2;
        r.id = 6;
        await r._.save();
        expect(r._.repository.defs.idField.key).toBe(r._.fields.id.defs.key);
        expect((await c.findId(6)).a).toBe(2);


    });

});