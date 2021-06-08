import { itAsync, Done, fitAsync } from "../testHelper.spec";
import { createData } from '../RowProvider.spec';
import { TestDataApiResponse } from '../basicRowFunctionality.spec';
import { DataApi } from '../../data-api';



import { Context } from '../../context';
import { Categories as newCategories } from '../remult-3-entities';
import { Field, Entity as EntityDecorator, EntityBase } from '../../remult3';




describe("data api", () => {
  let context = new Context();
  itAsync("getArray works with predefined filter", async () => {

    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);

    var api = new DataApi(c, context);
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
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    });
    var api = new DataApi(c, context);
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
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => {
      d.ok();
    };
    await api.get(t, 1);
    d.test();
  });
  itAsync("delete id  works with predefined filterand shouldnt return anything", async () => {
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => {
      d.ok();
    };
    await api.delete(t, 1);
    d.test();
  });
  itAsync("delete id  works with predefined filterand shouldnt return anything", async () => {
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
  });
  itAsync("put id  works with predefined filterand shouldnt return anything", async () => {
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = () => {
      d.ok();
    };
    await api.put(t, 2, { name: 'YAEL' });
    d.test();
  });
  itAsync("put id 1 works with predefined filterand shouldnt return anything", async () => {
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => {
      d.ok();
    };
    await api.put(t, 1, { name: 'YAEL' });
    d.test();
  });
  itAsync("getArray works with predefined filter", async () => {
    let [c, context] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, CategoriesForThisTest);
    var api = new DataApi(c, context);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(0);

      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.create()._.fields.description.defs.key)
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });

  itAsync("works with predefined Entity Filter", async () => {
    let [c] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    });
    expect((await c.iterate(x => x.id.isEqualTo(1)).first()).categoryName).toBe('noam');
    expect((await c.findId(1)).categoryName).toBe('noam');
  });

});

@EntityDecorator<stam1>({
  key: 'categories',

  fixedFilter: (c) => {
    return c.description.isEqualTo('b')
  }
})
class stam1 extends newCategories {

}
describe("", () => {
  itAsync("works with predefined Entity Filter", async () => {//
    let [c] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, stam1);
    let r = await c.find();
    expect(r.length).toBe(1, 'array length');
    expect(r[0].id).toBe(2, 'value of first row');
    expect(await c.count()).toBe(1, 'count');
    expect(await c.iterate(x => x.id.isEqualTo(1)).first()).toBe(undefined, 'find first');
    expect((await c.lookupAsync(x => x.id.isEqualTo(1)))._.isNew()).toBe(true, 'lookup ');
  });
})

@EntityDecorator<CategoriesForThisTest>({
  key: undefined,
  allowApiUpdate: true,
  allowApiDelete: true,
  apiDataFilter: (x) => {
    return x.description.isEqualTo('b')
  }

})
class CategoriesForThisTest extends newCategories { }