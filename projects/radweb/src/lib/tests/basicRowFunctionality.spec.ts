
import { __EntityValueProvider, NumberColumn, StringColumn, Entity, CompoundIdColumn, FilterConsumnerBridgeToUrlBuilder, UrlBuilder, DateTimeDateStorage, DataList, ColumnHashSet, BoolColumn } from '../core/utils';
import { createData } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from '../server/DataApi';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from '../core/inMemoryDatabase';
import { itAsync, itAsyncForEach, Done } from './testHelper.spec';

import { Categories, environment, Status } from './testModel/models';
import { TestBed, async } from '@angular/core/testing';
import { Context, Role, Allowed, EntityClass, ServerContext } from '../context/Context';
import { WebSqlDataProvider } from '../core/WebSqlDataProvider';
import { DataProviderFactory, RowsOfDataForTesting } from '../core/dataInterfaces1';

function itWithDataProvider(name: string, runAsync: (dpf: DataProviderFactory, rows?: RowsOfDataForTesting) => Promise<any>) {
  let webSql = new WebSqlDataProvider('test');
  itAsyncForEach<any>(name, [new InMemoryDataProvider(), webSql],
    (dp) => new Promise((res, rej) => {
      webSql.db.transaction(t => {
        t.executeSql("select name from sqlite_master where type='table'", null,
          (t1, r) => {
            for (let i = 0; i < r.rows.length; i++) {
              webSql.db.transaction(t => t.executeSql("delete from " + r.rows[i].name));
            }
            runAsync(dp, dp).then(res).catch(rej);
          }, (t, e) => {
            rej(e);
            return undefined;
          });
      }, (e) => rej(e));
    }));
}

class TestDataApiResponse implements DataApiResponse {
  success(data: any): void {
    fail('didnt expect success: ' + JSON.stringify(data));
  }
  forbidden() {
    fail('didnt expect forbidden:');
  }
  created(data: any): void {
    fail('didnt expect created: ' + JSON.stringify(data));
  }
  deleted(): void {
    fail('didnt expect deleted:');
  }
  notFound(): void {
    fail('not found');
  }
  error(data: DataApiError) {
    fail('error: ' + data + " " + JSON.stringify(data));
  }
  methodNotAllowed() {
    fail('methodNotAllowed api result');
  }
}





describe('Test basic row functionality', () => {
  it("finds its id column", () => {
    let c = new Categories();
    expect(c.__idColumn.jsonName).toBe("id");

  });
  it("object assign works", () => {
    let a: any = {};
    let b: any = {};
    a.info = 3;
    Object.assign(b, a);
    expect(b.info).toBe(3);

  });

  it("object is autonemous", () => {
    let x = new Categories();
    let y = new Categories();
    x.categoryName.value = 'noam';
    y.categoryName.value = 'yael';
    expect(x.categoryName.value).toBe('noam');
    expect(y.categoryName.value).toBe('yael');
  })
  it("find the col value", () => {
    let x = new Categories();
    let y = new Categories();
    x.categoryName.value = 'noam';
    y.categoryName.value = 'yael';
    expect(y.__getColumn(x.categoryName).value).toBe('yael');
  });
  itAsync("can be saved to a pojo", async () => {
    let x = new Categories();
    x.id.value = 1;
    x.categoryName.value = 'noam';
    let y = await x.__toPojo(new ColumnHashSet());
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });
  itAsync("json name is important", async () => {
    let x = new Categories();
    x.id.value = 1;
    x.categoryName.jsonName = 'xx';
    x.categoryName.value = 'noam';
    let y = await x.__toPojo(new ColumnHashSet());
    expect(y.id).toBe(1);
    expect(y.xx).toBe('noam');
  });
  itAsync("json name is important 1", async () => {
    let x = new myTestEntity();
    x.id.value = 1;
    expect(x.name1.jsonName).toBe('name');
    x.name1.value = 'noam';
    let y = await x.__toPojo(new ColumnHashSet());
    expect(y.id).toBe(1);
    expect(y.name).toBe('noam', JSON.stringify(y));
    y.name = 'yael';
    x.__fromPojo(y, new ColumnHashSet());
    expect(x.name1.value).toBe('yael');

  });
  it("json name is important", () => {
    let x = new myTestEntity();
    x.id.value = 1;
    x.name1.value = 'a';
    var y = new myTestEntity();
    expect(x.__getColumn(y.name1).value).toBe('a');


  });

});
@EntityClass
class myTestEntity extends Entity<number>{
  id = new NumberColumn();
  name1 = new StringColumn({ jsonName: 'name' });
  constructor() {
    super('myTestEntity');
    this.__initColumns();
  }

}

describe("data api", () => {
  itAsync("get based on id", async () => {


    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');

      d.ok();
    };
    await api.get(t, 1)
    d.test();
  });
  itAsync("get based on id with excluded columns", async () => {


    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c, { excludeColumns: c => [c.categoryName] });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe(undefined);

      d.ok();
    };
    await api.get(t, 1)
    d.test();
  });
  itAsync("get based on id virtual column", async () => {


    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');
      expect(data.categoryNameLength).toBe(4);
      d.ok();
    };
    await api.get(t, 1)
    d.test();
  });
  itAsync("get based on id virtual column async", async () => {


    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');
      expect(data.categoryNameLengthAsync).toBe(4);
      d.ok();
    };
    await api.get(t, 1)
    d.test();
  });

  itAsync("get based on id can fail", async () => {
    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.get(t, 2);
    d.test();
  });

  itAsync("put fails when not found", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowUpdate: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.put(t, 2, {});
    d.test();
  });
  itAsync("put with validations fails", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, {
      onSavingRow: c => c.categoryName.error = 'invalid',
      allowUpdate: true
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {

      expect(data.modelState.categoryName).toBe('invalid');
      d.ok();
    };
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
  });
  itAsync("put with validations works", async () => {
    let count = 0;
    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, {
      onSavingRow: c => { count++; },
      allowUpdate: true
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {


      d.ok();
    };
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');
    expect(count).toBe(1);
  });
  let ctx = new Context();
  itWithDataProvider("put with validations on entity fails",
    async (dataProvider) => {
      let c = ctx.for(entityWithValidations, dataProvider).create();

      await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
      let api = new DataApi(c, { allowUpdate: true });
      let t = new TestDataApiResponse();
      let d = new Done();
      t.error = async (data: any) => {
        expect(data.modelState.name).toBe('invalid');
        d.ok();
      };
      await api.put(t, 1, {
        name: '1'
      });
      d.test();
      var x = await c.source.find({ where: c.myId.isEqualTo(1) });
      expect(x[0].name.value).toBe('noam');

    });
  itWithDataProvider("put with validations on column fails", async (dp) => {

    let c = ctx.for(entityWithValidationsOnColumn, dp).create();

    await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
    let api = new DataApi(c, { allowUpdate: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      expect(data.modelState.name).toBe('invalid on column');
      d.ok();
    };
    await api.put(t, 1, {
      name: '1'
    });
    d.test();
    var x = await c.source.find({ where: c.myId.isEqualTo(1) });
    expect(x[0].name.value).toBe('noam');

  });
  itWithDataProvider("put with validations on entity fails", async (dp) => {
    let c = ctx.for(entityWithValidations, dp).create();

    await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
    let api = new DataApi(c, { allowUpdate: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      expect(data.modelState.name).toBe('invalid');
      d.ok();
    };
    await api.put(t, 1, {
      name: '1'
    });
    d.test();
    var x = await c.source.find({ where: c.myId.isEqualTo(1) });
    expect(x[0].name.value).toBe('noam');

  });
  itWithDataProvider("entity with different id column still works well", async (dp) => {

    let c = ctx.for(entityWithValidations, dp).create();

    c = await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
    c.name.value = 'yael';
    await c.save();
    expect(c.name.value).toBe('yael');
    expect((await c.source.find()).length).toBe(1);


  });
  itWithDataProvider("empty find works", async (dp) => {
    let ctx = new ServerContext();
    ctx.setDataProvider(dp);
    let c = ctx.for(Categories).create();
    c.id.value = 5;
    c.categoryName.value = 'test';
    await c.save();
    let l = await ctx.for(Categories).find();
    expect(l.length).toBe(1);
    expect(l[0].categoryName.value).toBe('test');


  });


  itAsync("put updates", async () => {
    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowUpdate: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam 1');
      d.ok();
    };
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');
  });
  itAsync("put updates and excluded columns", async () => {
    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowUpdate: true, excludeColumns: c => [c.categoryName] });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe(undefined);
      d.ok();
    };
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
  });
  itAsync("put updates and readonly columns", async () => {
    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowUpdate: true, readonlyColumns: c => [c.categoryName] });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
  });
  itAsync("delete fails when not found", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowDelete: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.delete(t, 2);
    d.test();
  });
  itAsync("delete works ", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, { allowDelete: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = () => d.ok();
    await api.delete(t, 1);

    let r = await c.source.find();
    expect(r.length).toBe(0);
  });
  itAsync("delete falis nicely ", async () => {

    let c = new Categories();
    c.setSource({
      provideFor: () => {
        let r = new ActualInMemoryDataProvider(() => new Categories(), [{ id: 1 }]);
        r.delete = () => { throw "ERROR"; };
        return r;
      }
    });
    var api = new DataApi(c, { allowDelete: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = () => d.ok();
    await api.delete(t, 1);

    d.test();
  });
  itAsync("post works", async () => {



    let c = await createData(async () => { });

    var api = new DataApi(c, { allowInsert: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.post(t, { id: 1, categoryName: 'noam' });
    d.test();
  });
  itAsync("post with logic works", async () => {


    let c = await createData(async (i) => { i(1, 'a'); });

    var api = new DataApi(c, {
      allowInsert: true,
      onSavingRow: async c => {
        if (c.isNew()) {

          await new Promise((ok) => {

            c.id.value = 2;
            ok();
          });
        }

      }
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
      expect(data.id).toBe(2);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.post(t, { categoryName: 'noam' });
    d.test();
  });
  itAsync("post with logic works and max", async () => {


    let c = await createData(async (i) => { i(1, 'a'); });
    let count = 0;
    var api = new DataApi(c, {
      allowInsert: true,
      onSavingRow: async c => {
        count++;
        if (c.isNew)
          c.id.value = (await c.source.max(c.id)) + 1;
      }
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
      expect(data.id).toBe(2);
      expect(data.categoryName).toBe('noam');
      d.ok();
      expect(count).toBe(1);
    };

    await api.post(t, { categoryName: 'noam' });
    expect(count).toBe(1);
    d.test();
  });
  itAsync("post with logic works and max in entity", async () => {

    let c = ctx.for(entityWithValidations).create();

    var api = new DataApi(c, { allowInsert: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
      expect(data.name).toBe('noam honig');
      expect(data.myId).toBe(1);
      d.ok();
    };
    entityWithValidations.savingRowCount = 0;
    await api.post(t, { name: 'noam honig' });
    expect(entityWithValidations.savingRowCount).toBe(1);
    d.test();

  });
  itAsync("post with validation fails", async () => {


    let c = await createData(async () => { });

    var api = new DataApi(c, { onSavingRow: c => c.categoryName.error = 'invalid', allowInsert: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      expect(data.modelState.categoryName).toBe('invalid');
      d.ok();
    };
    await api.post(t, { id: 1, categoryName: 'noam' });
    d.test();
    expect((await c.source.find()).length).toBe(0);
  });
  itAsync("post with syntax error fails well", async () => {


    let c = await createData(async () => { });

    var api = new DataApi(c, { onSavingRow: async c => { c.description.value.length + 1 }, allowInsert: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      expect(data.message).toBe("Cannot read property 'length' of undefined");
      d.ok();
    };
    await api.post(t, { id: 1, categoryName: 'noam' });
    d.test();
    expect((await c.source.find()).length).toBe(0);
  });
  itAsync("post fails on duplicate index", async () => {


    let c = await createData(async (i) => { i(1, 'noam'); });

    var api = new DataApi(c, { allowInsert: true });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = err => {
      if (!err.message)
        fail('no message');
      d.ok();
    };
    await api.post(t, { id: 1, categoryName: 'noam' });
    d.test();
  });

  itAsync("getArray works", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam');
      i(2, 'yael');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(2);
      expect(data[0].id).toBe(1);
      d.ok();
    };
    await api.getArray(t, undefined);
    d.test();
  });
  itAsync("getArray works with filter", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam');
      i(2, 'yael');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(2);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "id")
          return "2";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with filter and multiple values", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam');
      i(2, 'yael');
      i(3, 'yoni');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(2);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "id_ne")
          return ["1", "3"];
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with filter and multiple values with closed list columns", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam', undefined, Status.open);
      i(2, 'yael', undefined, Status.closed);
      i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(2);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "status_ne")
          return ["0", "2"];
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with filter contains", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam');
      i(2, 'yael');
      i(3, 'yoni');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(2);
      expect(data[0].id).toBe(1);
      expect(data[1].id).toBe(2);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.categoryName.jsonName + '_contains')
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with filter startsWith", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam');
      i(2, 'yael');
      i(3, 'yoni');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(2);
      expect(data[0].id).toBe(2);
      expect(data[1].id).toBe(3);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.categoryName.jsonName + '_st')
          return "y";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with predefined filter", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam', 'a');
      i(2, 'yael', 'b');
      i(3, 'yoni', 'a');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(2);
      expect(data[0].id).toBe(1);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.description.jsonName)
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with predefined filter", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam', 'a');
      i(2, 'yael', 'b');
      i(3, 'yoni', 'a');
    });
    var api = new DataApi(c, {
      get: { where: c => c.description.isEqualTo('b') }

    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(0);

      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.description.jsonName)
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });
  itAsync("getArray works with predefined filter", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam', 'a');
      i(2, 'yael', 'b');
      i(3, 'yoni', 'a');
    });
    var api = new DataApi(c, {
      get: { where: c => c.description.isEqualTo('b') }

    });
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
    var api = new DataApi(c, {
      get: { where: c => c.description.isEqualTo('b') }

    });
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
    });
    var api = new DataApi(c, {
      get: { where: c => c.description.isEqualTo('b') }

    });
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
    });
    var api = new DataApi(c, {
      allowDelete: true,
      get: { where: c => c.description.isEqualTo('b') }

    });
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
    });
    var api = new DataApi(c, {
      allowDelete: true,
      get: { where: c => c.description.isEqualTo('b') }

    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
  });
  itAsync("delete id  not Allowed", async () => {
    let c = await createData(async (i) => {
      i(1, 'noam', 'a');
      i(2, 'yael', 'b');
      i(3, 'yoni', 'a');
    });
    var api = new DataApi(c, {
      allowDelete: false
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
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
    });
    var api = new DataApi(c, {
      allowUpdate: true,
      get: { where: c => c.description.isEqualTo('b') }

    });
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
    });
    var api = new DataApi(c, {
      allowUpdate: true,
      get: { where: c => c.description.isEqualTo('b') }

    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => {
      d.ok();
    };
    await api.put(t, 1, { name: 'YAEL' });
    d.test();
  });
  itAsync("getArray works with sort", async () => {
    let c = await createData(async (i) => {
      i(1, 'a');
      i(2, 'c');
      i(3, 'b');
      i(4, 'c');
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(4);
      expect(data[0].id).toBe(1);
      expect(data[1].id).toBe(3);
      expect(data[2].id).toBe(4);
      expect(data[3].id).toBe(2);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "_sort")
          return "categoryName,id";
        if (x == "_order")
          return "asc,desc";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
    });
    d.test();
  });

  it("columnsAreOk", () => {
    let c = new Categories();
    expect(c.__iterateColumns().length).toBe(6);

  });

  itAsync("max works", async () => {
    let c = await createData(async i => {
      i(1, 'a');
      i(2, 'a');
      i(3, 'b');
    });
    expect(await c.source.max(c.id)).toBe(3);
    expect(await c.source.max(c.id, c.categoryName.isEqualTo('a'))).toBe(2);
    expect(await c.source.max(c.id, c.categoryName.isEqualTo('z'))).toBe(0);
  });

  itWithDataProvider("count", async (dp) => {
    let ctx = new ServerContext();
    ctx.setDataProvider(dp);
    expect(await ctx.for(Categories).count()).toBe(0);
    let c = ctx.for(Categories).create();
    c.id.value = 5;
    c.categoryName.value = 'test';
    await c.save();
    expect(await ctx.for(Categories).count()).toBe(1);
    });

});

describe("column validation", () => {
  it("validation clears on reset", () => {
    let c = new Categories();
    expect(c.isValid()).toBe(true);
    c.id.error = "x";
    expect(c.id.error).toBe("x");
    expect(c.isValid()).toBe(false);
    c.reset();
    expect(c.id.error).toBe(undefined);
    expect(c.isValid()).toBe(true);
  });
  it("validation clears on change", () => {
    let c = new Categories();
    expect(c.isValid()).toBe(true);
    c.id.error = "x";
    expect(c.isValid()).toBe(false);
    expect(c.id.error).toBe("x");
    c.id.value = 1;
    expect(c.isValid()).toBe(true);
    expect(c.id.error).toBe(undefined);
  });

});
describe("compund id", () => {
  const ctx = new Context();
  itAsync("start", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.__getName()].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.source.find();
    expect(r.length).toBe(2);
    expect(r[0].a.value).toBe(1);
    expect(r[0].id.value).toBe('1,11');
    r = await c.source.find({ where: c.id.isEqualTo('1,11') });

    expect(r.length).toBe(1);
    expect(r[0].a.value).toBe(1);
  });
  it("test id filter", () => {
    let c = ctx.for(CompoundIdEntity).create();
    let u = new UrlBuilder("");
    c.id.isEqualTo('1,11').__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(u));
    expect(u.url).toBe('?a=1&b=11');
  });
  itAsync("update", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.__getName()].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.source.find();
    expect(r[0].c.value).toBe(111);
    r[0].c.value = 55;
    expect(r[0].c.originalValue).toBe(111);
    let saved = await r[0].save();

    expect(r[0].c.value).toBe(55);


    expect(mem.rows[c.__getName()][0].c).toBe(55);
    expect(mem.rows[c.__getName()][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,11');
  });
  itAsync("update2", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.__getName()].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.source.find();
    r[0].b.value = 55;
    let saved = await r[0].save();


    expect(mem.rows[c.__getName()][0].b).toBe(55);
    expect(mem.rows[c.__getName()][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,55');
  });
  itAsync("insert", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.__getName()].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });
    c.setSource(mem);

    c.a.value = 3;
    c.b.value = 33;
    c.c.value = 3333;
    await c.save();
    expect(mem.rows[c.__getName()][2].b).toBe(33);
    expect(mem.rows[c.__getName()][2].id).toBe(undefined);
    expect(c.id.value).toBe('3,33');
  });
  itAsync("delete", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.__getName()].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });
    
    let r = await c.source.find();
    await r[1].delete();
    expect(mem.rows[c.__getName()].length).toBe(1);
    expect(mem.rows[c.__getName()][0].a).toBe(1);
  });

});
describe("test data list", () => {
  itAsync("delete works", async () => {
    let c = await createData(async i => {
      await i(1, 'a');
      await i(2, 'b');
      await i(3, 'c');
    });
    let rl = new DataList(c);
    await rl.get();
    expect(rl.items.length).toBe(3);
    await rl.items[1].delete();
    expect(rl.items.length).toBe(2);
  });
  it("dbname string works", () => {
    let i = 0;
    var co = new StringColumn({ dbName: 'test' });
    expect(co.__getDbName()).toBe('test');
  });
  it("dbname calcs Late", () => {
    let i = 0;
    var co = new StringColumn({ dbName: () => 'test' + (i++) });
    expect(i).toBe(0);
    expect(co.__getDbName()).toBe('test0');
    expect(i).toBe(1);
  });
  it("dbname of entity string works", () => {
    var e = new Categories({
      name: 'testName',
      dbName: 'test'
    });
    expect(e.__getDbName()).toBe('test');
  });
  it("dbname of entity can use column names", () => {
    var e = new EntityWithLateBoundDbName();
    expect(e.__getDbName()).toBe('(select CategoryID)');
  });

  itAsync("delete fails nicely", async () => {
    let c = new Categories();
    c.setSource({
      provideFor: () => {
        let r = new ActualInMemoryDataProvider(() => c, [{ id: 1 }, { id: 2 }, { id: 3 }]);
        r.delete = id => { return Promise.resolve().then(() => { throw Promise.resolve("error"); }) };
        return r;
      }
    });

    let rl = new DataList(c);
    await rl.get();
    expect(rl.items.length).toBe(3);
    try {
      await rl.items[1].delete();
      fail("was not supposed to get here");
    }
    catch (err) {
      expect(rl.items.length).toBe(3);
      expect(rl.items[1].error).toBe("error");
    }
  });

});
describe("test date storage", () => {
  it("works", () => {
    var s = new DateTimeDateStorage();
    let val = "1976-06-16";
    var d: Date = s.toDb(val);
    expect(d.getFullYear()).toBe(1976);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(16);

  });
});
describe("test bool value", () => {
  it("should work", () => {
    let bc = new BoolColumn();
    bc.jsonName = 'x';
    bc.__loadFromToPojo({ 'x': true });
    expect(bc.value).toBe(true);
    bc.__loadFromToPojo({ 'x': false });
    expect(bc.value).toBe(false);
  });
});
describe("check allowedDataType", () => {
  let c = new Context(undefined);
  let strA = 'roleA',
    strB = 'roleB',
    strC = 'roleC';
  let roleA = new Role(strA);
  let roleB = new Role(strB);
  let roleC = new Role(strC);
  c._setUser({ id: 'x', name: 'y', roles: [strA, strB] }
  );
  it("1", () => {
    expect(c.isAllowed(strA)).toBe(true);
  });
  function myIt(allowed: Allowed, expected: boolean, description?: string) {
    if (!description && allowed != undefined)
      description = allowed.toString();
    it(description, () => {
      expect(c.isAllowed(allowed)).toBe(expected);
    });
  }
  myIt(strA, true, "a");
  myIt(strC, false, "a");
  myIt([strA], true, "a");
  myIt([strC], false, "a");
  myIt([strA], true, "a");
  myIt([strC, strA], true, "a");
  myIt([strC, "strD"], false, "a");
  myIt(roleA, true);
  myIt(roleC, false);
  myIt([roleA], true);
  myIt([roleC], false);
  myIt([roleC, roleA], true);
  myIt([roleC, "strD"], false);
  myIt(c => c.isAllowed(roleA), true);
  myIt(true, true);
  myIt(false, false);
  myIt(undefined, undefined);
  it("no context", () => {
    let c = new Context(undefined);
    c._setUser(undefined);
    expect(c.isAllowed(true)).toBe(true);
    expect(c.isAllowed(c => true)).toBe(true);
    expect(c.isAllowed(false)).toBe(false);
    expect(c.isAllowed(c => false)).toBe(false);
    expect(c.isAllowed([false, true])).toBe(true);
    expect(c.isAllowed([false, c => true])).toBe(true);
    expect(c.isAllowed([false, false])).toBe(false);
    expect(c.isAllowed([false, c => false])).toBe(false);
    expect(c.isAllowed("abc")).toBe(false);
  });

});
@EntityClass
class CompoundIdEntity extends Entity<string>
{
  a = new NumberColumn();
  b = new NumberColumn();
  c = new NumberColumn();
  id = new CompoundIdColumn(this, this.a, this.b);
  constructor() {
    super("compountIdEntity");
    this.__initColumns();
  }
}
@EntityClass
export class entityWithValidations extends Entity<number>{
  myId = new NumberColumn();
  name = new StringColumn();
  static savingRowCount = 0;
  constructor() {
    super();
    this.__initColumns();
    this.__onSavingRow = async () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.error = 'invalid';

      if (this.isNew() && (!this.myId.value || this.myId.value == 0)) {

        this.myId.value = await this.source.max(this.myId) + 1;

      }
      entityWithValidations.savingRowCount++;
    };

  }
}
@EntityClass
export class entityWithValidationsOnColumn extends Entity<number>{
  myId = new NumberColumn();
  name = new StringColumn({
    onValidate: () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.error = 'invalid on column';
    }
  });
  constructor() {
    super();
    this.__initColumns();
  }
}
@EntityClass
export class entityWithValidationsOnEntityEvent extends Entity<number>{
  myId = new NumberColumn();
  name = new StringColumn();
  constructor() {
    super();
    this.__initColumns();
    this.__onValidate = () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.error = 'invalid';
    };
  }
}
@EntityClass
export class EntityWithLateBoundDbName extends Entity<number> {
  id = new NumberColumn({ dbName: 'CategoryID' });
  constructor() {
    super(
      {
        name: 'stam',
        dbName: () => '(select ' + this.id.__getDbName() + ')'

      });
    this.__initColumns();
  }
}