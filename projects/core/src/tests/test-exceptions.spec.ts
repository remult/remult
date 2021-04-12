import { itAsync, Done } from './testHelper.spec';
import { ServerContext, toPromise } from '../context';
import { NumberColumn } from '../columns/number-column';
import { Entity } from '../entity';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';

describe("test exception", () => {
    itAsync("test save exception", async () => {
        var mem = new InMemoryDataProvider();
        var c = new ServerContext({
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
        var x = c.for(class extends Entity<number> {
            id = new NumberColumn();
            constructor() {
                super('test');
            }
        }).create();
        try {
            await x.save();
        } catch (err) {

            expect(x.id.validationError).toBe('error for id');
            expect(err.message).toBe("error");
            expect(err.modelState.id).toBe('error for id');
            expect(err.exception.error.message).toBe("error");
            ok.ok();
        }
        ok.test();

        //   x.__entityData

    });

});
