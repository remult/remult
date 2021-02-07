

import { createData } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from '../data-api';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { itAsync, itAsyncForEach, Done, fitAsync } from './testHelper.spec';

import { Categories, Status } from './testModel/models';

import { Context, Role, Allowed, EntityClass, ServerContext } from '../context';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { DataProvider, __RowsOfDataForTesting } from '../data-interfaces';

import { Entity } from '../entity';
import { NumberColumn, BoolColumn } from '../columns/number-column';
import { StringColumn } from '../columns/string-column';
import { CompoundIdColumn } from '../columns/compound-id-column';
import { Column } from '../column';
import { DateTimeDateStorage } from '../columns/storage/datetime-date-storage';
import { DataList } from '../dataList';
import { UrlBuilder } from '../url-builder';
import { FilterSerializer } from '../filter/filter-consumer-bridge-to-url-builder';
import { SqlDatabase } from '../data-providers/sql-database';
import { async } from '@angular/core/testing';
import { addFilterToUrlAndReturnTrueIfSuccessful } from '../data-providers/rest-data-provider';
import { OrFilter } from '../filter/filter-interfaces';


function itWithDataProvider(name: string, runAsync: (dpf: DataProvider, rows?: __RowsOfDataForTesting) => Promise<any>) {
  let webSql = new WebSqlDataProvider('test');
  itAsyncForEach<any>(name, [new InMemoryDataProvider(), new SqlDatabase(webSql)],
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

export class TestDataApiResponse implements DataApiResponse {
  progress(progress: number): void {
    
  }
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
    let c = new Context().for(Categories).create();
    expect(c.columns.idColumn.defs.key).toBe("id");

  });
  it("object assign works", () => {
    let a: any = {};
    let b: any = {};
    a.info = 3;
    Object.assign(b, a);
    expect(b.info).toBe(3);

  });
  itAsync("Original values update correctly", async () => {
    let c = await (await createData(async insert => await insert(1, 'noam'), Categories)).findFirst();
    expect(c.categoryName.value).toBe('noam');
    expect(c.categoryName.originalValue).toBe('noam');
    c.categoryName.value = 'yael';
    expect(c.categoryName.value).toBe('yael');
    expect(c.categoryName.originalValue).toBe('noam');
    await c.save();
    expect(c.categoryName.value).toBe('yael');
    expect(c.categoryName.originalValue).toBe('yael');

  });

  it("object is autonemous", () => {
    let x = new Context().for(Categories).create();
    let y = new Context().for(Categories).create();
    x.categoryName.value = 'noam';
    y.categoryName.value = 'yael';
    expect(x.categoryName.value).toBe('noam');
    expect(y.categoryName.value).toBe('yael');
  })
  it("find the col value", () => {
    let x = new Context().for(Categories).create();
    let y = new Context().for(Categories).create();
    x.categoryName.value = 'noam';
    y.categoryName.value = 'yael';
    expect(y.columns.find(x.categoryName).value).toBe('yael');
  });
  itAsync("can be saved to a pojo", async () => {
    let ctx = new Context().for(Categories);
    let x = ctx.create();
    x.id.value = 1;
    x.categoryName.value = 'noam';
    let y = ctx.toApiPojo(x);
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });
  itAsync("json name is important", async () => {
    let ctx = new Context().for(Categories);
    let x = ctx.create();
    x.id.value = 1;
    x.categoryName.defs.key = 'xx';
    x.categoryName.value = 'noam';
    let y = ctx.toApiPojo(x);;
    expect(y.id).toBe(1);
    expect(y.xx).toBe('noam');
  });
  itAsync("json name is important 1", async () => {
    let ctx = new Context().for(myTestEntity);
    let x = ctx.create();
    x.id.value = 1;
    expect(x.name1.defs.key).toBe('name');
    x.name1.value = 'noam';
    let y = ctx.toApiPojo(x);
    expect(y.id).toBe(1);
    expect(y.name).toBe('noam', JSON.stringify(y));
    y.name = 'yael';
    new Context().for(myTestEntity)._updateEntityBasedOnApi(x, y);

    expect(x.name1.value).toBe('yael');

  });
  it("json name is important", () => {
    let x = new myTestEntity();
    x.id.value = 1;
    x.name1.value = 'a';
    var y = new myTestEntity();
    expect(x.columns.find(y.name1).value).toBe('a');


  });

});
@EntityClass
class myTestEntity extends Entity<number>{
  id = new NumberColumn();
  name1 = new StringColumn({ key: 'name' });
  constructor() {
    super('myTestEntity');
    this.__initColumns();
  }

}

describe("data api", () => {
  itAsync("get based on id", async () => {


    let c = await createData(async insert => await insert(1, 'noam'));

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

  itAsync("get based on id virtual column", async () => {


    let c = await createData(async insert => await insert(1, 'noam'));

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


    let c = await createData(async insert => await insert(1, 'noam'));

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
    let c = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.get(t, 2);
    d.test();
  });



  let ctx = new Context();
  ctx.setDataProvider(new InMemoryDataProvider());
  itWithDataProvider("put with validations on entity fails",
    async (dataProvider) => {
      let s = ctx.for(entityWithValidations, dataProvider);
      let c = s.create();
      c.myId.value = 1;
      c.name.value = 'noam';
      await c.save();
      let api = new DataApi(s);
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
      var x = await s.find({ where: c => c.myId.isEqualTo(1) });
      expect(x[0].name.value).toBe('noam');

    });
  itWithDataProvider("filter works on all db",
    async (dataProvider) => {

      let s = await create4RowsInDp(ctx, dataProvider);
      expect((await s.find({ where: c => c.myId.isIn(1, 3) })).length).toBe(2);

    });
  itWithDataProvider("filter works on all db or",
    async (dataProvider) => {

      let s = await create4RowsInDp(ctx, dataProvider);
      expect((await s.find({ where: c => new OrFilter(c.myId.isEqualTo(1),c.myId.isEqualTo(3))  })).length).toBe(2);

    });
  itWithDataProvider("put with validations on column fails", async (dp) => {
    var s = ctx.for(entityWithValidationsOnColumn, dp);
    let c = s.create();

    c.myId.value = 1;
    c.name.value = 'noam';
    await c.save();
    let api = new DataApi(s);
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
    var x = await s.find({ where: c => c.myId.isEqualTo(1) });
    expect(x[0].name.value).toBe('noam');

  });
  itWithDataProvider("put with validations on entity fails", async (dp) => {
    var s = ctx.for(entityWithValidations, dp);
    let c = s.create();

    c.myId.value = 1; c.name.value = 'noam';
    await c.save();
    let api = new DataApi(s);
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
    var x = await s.find({ where: c => c.myId.isEqualTo(1) });
    expect(x[0].name.value).toBe('noam');

  });
  itWithDataProvider("entity with different id column still works well", async (dp) => {
    let s = ctx.for(entityWithValidations, dp);
    let c = s.create();

    c.myId.value = 1; c.name.value = 'noam';
    await c.save();
    c.name.value = 'yael';
    await c.save();
    expect(c.name.value).toBe('yael');
    expect((await s.find()).length).toBe(1);


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
  itAsync("test number is always number", async () => {
    let amount = new NumberColumn();
    let total = new NumberColumn();
    total.value = 10;
    amount.__valueProvider = {
      getValue: (a, b) => '15',
      getOriginalValue: () => '15',
      setValue: (a, b) => { }
    };
    total.value += amount.value;
    expect(total.value).toBe(25);

  });



  itAsync("delete fails when not found", async () => {

    let c = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.delete(t, 2);
    d.test();
  });
  itAsync("delete works ", async () => {

    let c = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = () => d.ok();
    await api.delete(t, 1);

    let r = await c.find();
    expect(r.length).toBe(0);
  });
  itAsync("delete falis nicely ", async () => {
    let ctx = new ServerContext();
    ctx.setDataProvider({
      getEntityDataProvider: (x) => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }]);
        r.delete = () => { throw "ERROR"; };
        return r;
      }, transaction: undefined
    });

    var api = new DataApi(ctx.for(Categories));
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = () => d.ok();
    await api.delete(t, 1);

    d.test();
  });
  itAsync("post works", async () => {



    let c = await createData(async () => { });

    var api = new DataApi(c);
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

  itAsync("post with logic works and max in entity", async () => {

    let c = ctx.for(entityWithValidations);

    var api = new DataApi(c);
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

  itAsync("post fails on duplicate index", async () => {


    let c = await createData(async (i) => { await i(1, 'noam'); });

    var api = new DataApi(c);
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
      await i(1, 'noam');
      await i(2, 'yael');
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
      await i(1, 'noam');
      await i(2, 'yael');
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
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("getArray works with filter and multiple values", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
      await i(3, 'yoni');
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
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("getArray works with filter and multiple values with closed list columns", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
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
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("getArray works with filter and in with closed list columns", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
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
        if (x == "status_in")
          return '[1, 2]';
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("get array works with filter in body", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
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
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    }, {
      status_in: '[1, 2]'
    });
    d.test();
  });
  itAsync("get array works with filter in body and in array statement", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
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
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    }, {
      status_in: [1, 2]
    });
    d.test();
  });
  itAsync("get array works with filter in body and or statement", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
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
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    }, {
      OR:[
        {status:1},
        {status:2}
      ]
    });
    d.test();
  });
  itAsync("entity order by works", async () => {
    let context = new Context();
    let c = await createData(async insert => {
      await insert(1, 'noam');
      await insert(2, "yoni");
      await insert(3, "yael");
    },
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            defaultOrderBy: () => [this.categoryName]
          });
        }
      });


    var x = await c.find();
    expect(x[0].id.value).toBe(1);
    expect(x[1].id.value).toBe(3);
    expect(x[2].id.value).toBe(2);

  });
  itAsync("delete with validation fails", async () => {
    let context = new Context();
    var deleting = new Done();
    let happend = false;
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiDelete: true,
            deleted: () => happend = true,
            deleting: () => {
              deleting.ok();
              this.categoryName.validationError = 'err';
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      d.ok();
    };
    await api.delete(t, 1);
    d.test();
    deleting.test();
    expect(happend).toBe(false);
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
  });
  itAsync("delete with validation exception fails", async () => {
    let context = new Context();
    var deleting = new Done();
    let happend = false;
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiDelete: true,
            deleted: () => happend = true,
            deleting: () => {
              deleting.ok();
              throw 'err';
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      d.ok();
    };
    await api.delete(t, 1);
    d.test();
    deleting.test();
    expect(happend).toBe(false);
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
  });
  itAsync("delete with validation exception fails - no data api", async () => {
    var deleting = new Done();
    let happend = false;

    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiDelete: true,
            deleted: () => happend = true,
            deleting: () => {
              deleting.ok();
              throw 'err';
            }
          });
        }
      });
    let h2 = false;
    let h3 = false;
    try {
      await (await c.findId(1)).delete();
      h2 = true;
    } catch {
      h3 = true;
    }
    expect(h2).toBe(false);
    expect(h3).toBe(true);

  });
  itAsync("delete works", async () => {
    let context = new Context();
    var deleting = new Done();
    let happend = false;
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiDelete: true,
            deleted: () => {
              happend = true;
              expect(this.id.value).toBe(1)
            },
            deleting: () => {
              deleting.ok();
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = async () => {
      d.ok();
    };
    await api.delete(t, 1);
    d.test();
    deleting.test();
    expect(happend).toBe(true);
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x.length).toBe(0);
  });

  itAsync("put with validation fails", async () => {
    let context = new Context();
    let count = 0;
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true,
            saving: () => {
              count++;
              if (this.categoryName.value.includes('1'))
                this.categoryName.validationError = 'err';
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      d.ok();
    };
    count = 0;
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');
    expect(count).toBe(1);

  });
  itAsync("put with validation works", async () => {
    let context = new Context();
    let count = 0;
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true,
            saving: () => count++
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      d.ok();
    };
    count = 0;
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });
    d.test();
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');
    expect(count).toBe(1);

  });
  itAsync("afterSave works", async () => {
    let context = new Context();
    let count = 0;
    let startTest = false;
    let savedWorked = new Done();
    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true,
            saving: () => count++,
            saved: () => {
              if (!startTest)
                return;
              savedWorked.ok();
              expect(this.categoryName.originalValue).toBe('noam');
              expect(this.categoryName.value).toBe('noam 1');
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      d.ok();
    };
    count = 0;
    startTest = true;
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });

    d.test();
    savedWorked.test();
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');
    expect(count).toBe(1);

  });
  itAsync("afterSave works on insert", async () => {
    let context = new Context();


    let savedWorked = new Done();
    let c = await createData(async insert => { },
      class extends Categories {
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true,
            allowApiInsert: true,

            saved: () => {
              savedWorked.ok();
              expect(this.isNew()).toBe(true);
              expect(this.categoryName.originalValue).toBe(undefined);
              expect(this.categoryName.value).toBe('noam 1');
            }
          });
        }
      });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.created = async (data: any) => {
      d.ok();
    };


    await api.post(t, {
      id: 1,
      categoryName: 'noam 1'
    });

    d.test();
    savedWorked.test();
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');


  });
  itAsync("put with disable save still works", async () => {


    let startTest = false;
    let context = new ServerContext();
    let mem = new InMemoryDataProvider();
    context.setDataProvider(mem);
    let entity = class extends Categories {
      constructor() {
        super({
          name: 'testE',
          allowApiUpdate: true,
          saving: (cancel) => {
            if (startTest) {

              mem.rows["testE"][0].categoryName = 'kuku';
              expect(mem.rows["testE"][0].categoryName).toBe('kuku');
              cancel();
            }
          }
        });
      };
    }
    {

      let c = context.for(entity).create();
      c.id.value = 1;
      c.categoryName.value = 'name';
      c.description.value = "noam";
      await c.save();

    };


    var api = new DataApi(context.for(entity));
    let t = new TestDataApiResponse();
    let d = new Done();


    t.success = data => {
      expect(data.categoryName).toBe('kuku');
      d.ok();
    };
    startTest = true;
    await api.put(t, 1, {
      categoryName: 'noam 1'
    });

    d.test();
    var x = await context.for(entity).find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('kuku');


  });
  itAsync("get based on id with excluded columns", async () => {
    let context = new Context();

    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        categoryName = new StringColumn({ includeInApi: false });
      });

    var api = new DataApi(c);
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
  itAsync("row reload", async () => {
    let context = new Context();

    let c = await createData(async insert => await insert(1, 'noam'), Categories);
    let a = await c.findId(1);
    let b = await c.findId(1);
    a.categoryName.value = "yael";
    await a.save();
    expect(b.categoryName.value).toBe('noam');
    await b.reload();
    expect(b.categoryName.value).toBe('yael');
  });

  itAsync("put updates", async () => {
    let context = new Context();

    let c = await createData(async insert => await insert(1, 'noam'), Categories);

    var api = new DataApi(c);
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
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');

  });
  itAsync("put updates and readonly columns", async () => {
    let context = new Context();

    let c = await createData(async insert => await insert(1, 'noam'),
      class extends Categories {
        categoryName = new StringColumn({ allowApiUpdate: false });
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true
          });
        }
      });

    var api = new DataApi(c);
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
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');

  });
  itAsync("put fails when not found", async () => {
    let context = new Context();

    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.put(t, 2, {});
    d.test();

  });
  itAsync("put updates", async () => {
    let context = new Context();

    let c = await createData(async insert => insert(1, 'noam'),
      class extends Categories {
        categoryName = new StringColumn({ includeInApi: false });
        constructor() {
          super({
            name: undefined,
            allowApiUpdate: true
          });
        }
      });

    var api = new DataApi(c);
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
    var x = await c.find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam');

  });
  itAsync("post with syntax error fails well", async () => {
    let context = new Context();

    let c = await createData(async insert => { }, class extends Categories {
      constructor() {
        super({
          name: undefined,
          allowApiInsert: true,
          saving: () => this.description.value.length + 1
        });
      }
    });

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = async (data: any) => {
      expect(data.message).toBe("Cannot read property 'length' of undefined");
      d.ok();
    };
    await api.post(t, { id: 1, categoryName: 'noam' });
    d.test();
    expect((await c.find()).length).toBe(0);

  });
  itAsync("getArray works with filter contains", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
      await i(3, 'yoni');
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
        if (x == c.create().categoryName.defs.key + '_contains')
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("getArray works with filter startsWith", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
      await i(3, 'yoni');
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
        if (x == c.create().categoryName.defs.key + '_st')
          return "y";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("getArray works with predefined filter", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
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
        if (x == c.create().description.defs.key)
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });
  itAsync("allow api read depends also on api crud", async () => {
    let sc = new ServerContext();
    expect(sc.for(class extends Entity {
      constructor() {
        super({ name: 'a', allowApiCRUD: false })
      }
    })._getApiSettings().allowRead).toBe(false);
  });
  itAsync("allow api read depends also on api crud", async () => {
    let sc = new ServerContext();
    expect(sc.for(class extends Entity {
      constructor() {
        super({ name: 'a', allowApiCRUD: false, allowApiRead: true })
      }
    })._getApiSettings().allowRead).toBe(true);
  });




  itAsync("delete id  not Allowed", async () => {
    let c = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, class extends Categories {
      constructor() {
        super({
          name: undefined,
          allowApiDelete: false
        })
      }
    });
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
  });

  itAsync("getArray works with sort", async () => {
    let c = await createData(async (i) => {
      await i(1, 'a');
      await i(2, 'c');
      await i(3, 'b');
      await i(4, 'c');
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
      , getBaseUrl: () => ''
    });
    d.test();
  });

  it("columnsAreOk", () => {
    let c = new Context().for(Categories).create();
    expect(c.columns.toArray().length).toBe(6);

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
describe("rest call use url get or fallback to post", () => {
  it("should get", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a: 1 }, url)).toBe(true);
    expect(url.url).toBe("?a=1");
  });
  it("should get 1", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a_ne: 1 }, url)).toBe(true);
    expect(url.url).toBe("?a_ne=1");
  });
  it("should get 2", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a_ne: [1, 2] }, url)).toBe(true);
    expect(url.url).toBe("?a_ne=1&a_ne=2");
  });
  it("should get 3", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a_in: [1, 2] }, url)).toBe(true);
    expect(url.url).toBe("?a_in=%5B1%2C2%5D");
  });
  it("should post ", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ a_in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }, url)).toBe(false);
  });
  it("should post ", () => {
    let url = new UrlBuilder('');
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ or: [{a:1},{a:3}] }, url)).toBe(false);
  });
});
describe("column validation", () => {
  it("validation clears on reset", () => {
    let c = new Context().for(Categories).create();
    expect(c.isValid()).toBe(true);
    c.id.validationError = "x";
    expect(c.id.validationError).toBe("x");
    expect(c.isValid()).toBe(false);
    c.undoChanges();
    expect(c.id.validationError).toBe(undefined);
    expect(c.isValid()).toBe(true);
  });
  it("validation clears on change", () => {
    let c = new Context().for(Categories).create();
    expect(c.isValid()).toBe(true);
    c.id.validationError = "x";
    expect(c.isValid()).toBe(false);
    expect(c.id.validationError).toBe("x");
    c.id.value = 1;
    expect(c.isValid()).toBe(true);
    expect(c.id.validationError).toBe(undefined);
  });

});
describe("test web sql identity", () => {
  itAsync("play", async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'));
    let c = new Context();
    await sql.execute("drop table if exists t1");
    c.setDataProvider(sql);
    let f = c.for(class extends Entity {
      id = new NumberColumn();
      name = new StringColumn()
      constructor() {
        super({
          name: 't1',
          dbAutoIncrementId: true
        })
      }
    });
    let t = f.create();
    t.name.value = 'a';
    await t.save();
    expect(t.id.value).toBe(1);
    t = f.create();
    t.name.value = 'b';
    await t.save();
    expect(t.id.value).toBe(2);
  });
});
describe("compound id", () => {
  itAsync("compund sql",
    async () => {
      let sql = new SqlDatabase(new WebSqlDataProvider('compound'));
      let ctx = new Context();
      ctx.setDataProvider(sql);

      let cod = ctx.for(CompoundIdEntity);
      for (const od of await cod.find({ where: od => od.a.isEqualTo(99) })) {
        await od.delete();
      }
      let od = cod.create();
      od.a.value = 99;
      od.b.value = 1;
      await od.save();
      od = await cod.findFirst({ where: od => od.a.isEqualTo(99) });
      od.c.value = 5;
      await od.save();
      await od.delete();

    });
  const ctx = new Context();
  itAsync("start", async () => {
    let mem = new InMemoryDataProvider();
    let s = ctx.for(CompoundIdEntity, mem);

    mem.rows[s.create().defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await s.find();
    expect(r.length).toBe(2);
    expect(r[0].a.value).toBe(1);
    expect(r[0].id.value).toBe('1,11');
    r = await s.find({ where: c => c.id.isEqualTo('1,11') });

    expect(r.length).toBe(1);
    expect(r[0].a.value).toBe(1);
  });
  it("test id filter", () => {
    let c = ctx.for(CompoundIdEntity).create();
    let f = new FilterSerializer();
    c.id.isEqualTo('1,11').__applyToConsumer(f);
    expect(f.result).toEqual({a:'1',b:'11'});
  });
  itAsync("update", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem);
    mem.rows[c.create().defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.find();
    expect(r[0].c.value).toBe(111);
    r[0].c.value = 55;
    expect(r[0].c.originalValue).toBe(111);
    let saved = await r[0].save();

    expect(r[0].c.value).toBe(55);


    expect(mem.rows[c.create().defs.name][0].c).toBe(55);
    expect(mem.rows[c.create().defs.name][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,11');
  });
  itAsync("update2", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem);
    mem.rows[c.create().defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.find();
    r[0].b.value = 55;
    let saved = await r[0].save();


    expect(mem.rows[c.create().defs.name][0].b).toBe(55);
    expect(mem.rows[c.create().defs.name][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,55');
  });
  itAsync("insert", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem).create();
    mem.rows[c.defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    c.a.value = 3;
    c.b.value = 33;
    c.c.value = 3333;
    await c.save();
    expect(mem.rows[c.defs.name][2].b).toBe(33);
    expect(mem.rows[c.defs.name][2].id).toBe(undefined);
    expect(c.id.value).toBe('3,33');
  });
  itAsync("delete", async () => {
    let mem = new InMemoryDataProvider();
    let c = ctx.for(CompoundIdEntity, mem);
    mem.rows[c.create().defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });

    let r = await c.find();
    await r[1].delete();
    expect(mem.rows[c.create().defs.name].length).toBe(1);
    expect(mem.rows[c.create().defs.name][0].a).toBe(1);
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
    expect(co.defs.dbName).toBe('test');
  });
  it("dbname calcs Late", () => {
    let i = 0;
    var co = new StringColumn({ sqlExpression: () => 'test' + (i++) });
    expect(i).toBe(0);
    expect(co.defs.dbName).toBe('test0');
    expect(i).toBe(1);
  });
  it("dbname of entity string works", () => {
    var e = new Categories({
      name: 'testName',
      dbName: 'test'
    });
    expect(e.defs.dbName).toBe('test');
  });
  it("dbname of entity can use column names", () => {
    var e = new EntityWithLateBoundDbName();
    expect(e.defs.dbName).toBe('(select CategoryID)');
  });

  itAsync("delete fails nicely", async () => {

    let cont = new ServerContext();
    cont.setDataProvider({
      getEntityDataProvider: x => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }, { id: 2 }, { id: 3 }]);
        r.delete = id => { return Promise.resolve().then(() => { throw Promise.resolve("error"); }) };
        return r;
      }, transaction: undefined
    });
    let rl = new DataList(cont.for(Categories));
    await rl.get();
    expect(rl.items.length).toBe(3);
    try {
      await rl.items[1].delete();
      fail("was not supposed to get here");
    }
    catch (err) {
      expect(rl.items.length).toBe(3);
      expect(rl.items[1].validationError).toBe("error");
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
    bc.defs.key = 'x';
    bc.__loadFromPojo({ 'x': true });
    expect(bc.value).toBe(true);
    bc.__loadFromPojo({ 'x': false });
    expect(bc.value).toBe(false);
  });
});
describe("Column settings stuff", () => {
  it("should translate caption", () => {

    let x = Column.consolidateOptions("noam");
    expect(x.caption).toBe("noam");
  });
  it("should translate caption2", () => {
    let x = Column.consolidateOptions({ caption: 'noam' });
    expect(x.caption).toBe("noam");
  });
  it("should translate caption2", () => {
    let x = Column.consolidateOptions('noam', { key: 'yael' });
    expect(x.caption).toBe("noam");
    expect(x.key).toBe("yael");
  });


});
describe("check allowedDataType", () => {
  let c = new Context();
  c.setDataProvider(new InMemoryDataProvider());
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
    let c = new Context();
    c.setDataProvider(new InMemoryDataProvider());
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
  id = new CompoundIdColumn(this.a, this.b);
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
  constructor(context: Context) {
    super({
      name: undefined,
      allowApiCRUD: true
    });
    this.__initColumns();
    this.__onSavingRow = async () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.validationError = 'invalid';

      if (this.isNew() && (!this.myId.value || this.myId.value == 0)) {
        let e = await context.for(entityWithValidations).find({
          orderBy: x => [{ column: x.myId, descending: true }],
          limit: 1
        });

        this.myId.value = e.length ? e[0].myId.value + 1 : 1;

      }
      entityWithValidations.savingRowCount++;
    };

  }
}
@EntityClass
export class entityWithValidationsOnColumn extends Entity<number>{
  myId = new NumberColumn();
  name = new StringColumn({
    validate: () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.validationError = 'invalid on column';
    }
  });
  constructor() {
    super({ name: undefined, allowApiUpdate: true });
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
        this.name.validationError = 'invalid';
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
        dbName: () => '(select ' + this.id.defs.dbName + ')'

      });
    this.__initColumns();
  }
}

async function create4RowsInDp(ctx: Context, dataProvider: DataProvider) {
  let s = ctx.for(entityWithValidations, dataProvider);
  let c = s.create();
  c.myId.value = 1;
  c.name.value = 'noam';
  await c.save();
  c = s.create();
  c.myId.value = 2;
  c.name.value = 'yael';
  await c.save();
  c = s.create();
  c.myId.value = 3;
  c.name.value = 'yoni';
  await c.save();
  c = s.create();
  c.myId.value = 4;
  c.name.value = 'maayan';
  await c.save();
  return s;
}
