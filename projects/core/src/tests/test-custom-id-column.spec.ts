import { Remult } from '../context';
import { itWithDataProvider } from './basicRowFunctionality.spec';
import { Field, Entity, EntityBase } from '../remult3';



describe("custom id column", () => {
    itWithDataProvider("basic test", async (dpf) => {
        let remult = new Remult();
        remult.setDataProvider(dpf);
        let type = class extends EntityBase {
            a: number;
            b: number;
        }
        Entity('custom')(type);
        Field()(type.prototype, 'a');
        Field()(type.prototype, 'b');
        let c = remult.repo(type);
        let r = c.create();
        r.a = 1;
        r.b = 1;
        await r._.save();
        r = c.create();
        r.a = 2;
        r.b = 2;
        await r._.save();
        expect(c.metadata.idMetadata.field.key).toBe(c.metadata.fields.a.key);


    });
    itWithDataProvider("basic test id column not first column", async (dpf) => {
        let remult = new Remult();
        remult.setDataProvider(dpf);
        let type = class extends EntityBase {
            a: number;
            id: number;
        }
        Entity('custom2')(type);
        Field({ valueType: Number })(type.prototype, 'a');
        Field({ valueType: Number })(type.prototype, 'id');
        let c = remult.repo(type);
        let r = c.create();
        r.a = 1;
        r.id = 5;
        await r._.save();
        r = c.create();
        r.a = 2;
        r.id = 6;
        await r._.save();
        expect(r._.repository.metadata.idMetadata.field.key).toBe(r._.fields.id.metadata.key);
        expect((await c.findId(6)).a).toBe(2);


    });

});