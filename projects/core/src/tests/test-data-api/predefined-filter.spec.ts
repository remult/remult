import { itAsync, Done } from "../testHelper.spec";
import { createData, CategoriesForTesting } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';
import { Entity } from '../../entity';
import { NumberColumn } from '../../columns/number-column';
import { StringColumn } from '../../columns/string-column';
import { StatusColumn } from '../testModel/models';
import { Context } from '../../context';



describe("data api", () => {
    let context = new Context();
    itAsync("getArray works with predefined filter", async () => {

        let c = await createData(async (i) => {
            i(1, 'noam', 'a');
            i(2, 'yael', 'b');
            i(3, 'yoni', 'a');
        }, CategoriesForThisTest);

        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.length).toBe(1);
            expect(data[0].id).toBe(2);

            d.ok();
        };
        await api.getArray(t, undefined);
        d.test();

    });
    itAsync("get works with predefined filter", async () => {
        let c = await createData(async (i) => {
            i(1, 'noam', 'a');
            i(2, 'yael', 'b');
            i(3, 'yoni', 'a');
        });
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {

            expect(data.id).toBe(2);

            d.ok();
        };
        await api.get(t, 2);
        d.test();
    });
    itAsync("get id  works with predefined filterand shouldnt return anything", async () => {
        let c = await createData(async (i) => {
            i(1, 'noam', 'a');
            i(2, 'yael', 'b');
            i(3, 'yoni', 'a');
        }, CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.notFound = () => {
            d.ok();
        };
        await api.get(t, 1);
        d.test();
    });
    itAsync("delete id  works with predefined filterand shouldnt return anything", async () => {
        let c = await createData(async (i) => {
            i(1, 'noam', 'a');
            i(2, 'yael', 'b');
            i(3, 'yoni', 'a');
        }, CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.notFound = () => {
            d.ok();
        };
        await api.delete(t, 1);
        d.test();
    });
    itAsync("delete id  works with predefined filterand shouldnt return anything", async () => {
        let c = await createData(async (i) => {
            i(1, 'noam', 'a');
            i(2, 'yael', 'b');
            i(3, 'yoni', 'a');
        }, CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.deleted = () => {
            d.ok();
        };
        await api.delete(t, 2);
        d.test();
    });
    itAsync("put id  works with predefined filterand shouldnt return anything", async () => {
        let c = await createData(async (i) => {
          i(1, 'noam', 'a');
          i(2, 'yael', 'b');
          i(3, 'yoni', 'a');
        },CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = () => {
          d.ok();
        };
        await api.put(t, 2, { name: 'YAEL' });
        d.test();
      });
      itAsync("put id 1 works with predefined filterand shouldnt return anything", async () => {
        let c = await createData(async (i) => {
          i(1, 'noam', 'a');
          i(2, 'yael', 'b');
          i(3, 'yoni', 'a');
        },CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.notFound = () => {
          d.ok();
        };
        await api.put(t, 1, { name: 'YAEL' });
        d.test();
      });
      itAsync("getArray works with predefined filter", async () => {
        let c = await createData(async (i) => {
          i(1, 'noam', 'a');
          i(2, 'yael', 'b');
          i(3, 'yoni', 'a');
        },CategoriesForThisTest);
        var api = new DataApi(c);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
          expect(data.length).toBe(0);
    
          d.ok();
        };
        await api.getArray(t, {
          get: x => {
            if (x == c.create().description.jsonName)
              return "a";
            return undefined;
          }, clientIp: '', user: undefined, getHeader: x => ""
          , getBaseUrl: () => ''
        });
        d.test();
      });
});

class CategoriesForThisTest extends Entity<number> implements CategoriesForTesting {
    id = new NumberColumn();
    categoryName = new StringColumn();
    description = new StringColumn();
    status = new StatusColumn();
    constructor() {
        super({
            name: undefined,
            allowApiUpdate: true,
            allowApiDelete: true,
            apiDataFilter: () => {
                return this.description.isEqualTo('b')
            }
        });
    }


}