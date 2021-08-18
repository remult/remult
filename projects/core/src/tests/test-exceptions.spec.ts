import { itAsync, Done } from './testHelper.spec';
import { Context, toPromise } from '../context';


import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { Field, Entity, EntityBase } from '../remult3';

describe("test exception", () => {
    itAsync("test save exception", async () => {
        var mem = new InMemoryDataProvider();
        var c = new Context();
        c.setDataProvider({
            getEntityDataProvider: e => {
                let r = mem.getEntityDataProvider(e);
                return {
                    count: undefined, delete: undefined, find: undefined, insert: async x => {
                        return toPromise(new Promise((res, err) => {
                            err({
                                error: {
                                    message: 'error',
                                    modelState: {
                                        id: 'error for id'
                                    }
                                }
                            });
                        }));


                    }, update: undefined
                }
            },
            transaction: undefined
        });
        var ok = new Done();
        let type = class extends EntityBase{
            id:string;
        }
        Entity({key:'test'})(type);
        Field()(type.prototype,"id");
        var x = c.for(type).create();
        try {
            await x._.save();
        } catch (err) {

            expect(x._.fields.id.error).toBe('error for id');
            expect(err.message).toBe("error");
            expect(err.modelState.id).toBe('error for id');
            ok.ok();
        }
        ok.test();


    });

});
