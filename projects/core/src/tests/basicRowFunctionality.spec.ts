

import { createData, createDataOld } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from '../data-api';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { itAsync, itAsyncForEach, Done, fitAsync, fitAsyncForEach } from './testHelper.spec';

import { Categories, Status } from './testModel/models';

import { Context, Role, Allowed, EntityClass, ServerContext } from '../context';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { DataProvider, __RowsOfDataForTesting } from '../data-interfaces';


import { NumberColumn, BoolColumn } from '../columns/number-column';
import { StringColumn } from '../columns/string-column';
import { CompoundIdColumn } from '../columns/compound-id-column';

import { DateTimeDateStorage } from '../columns/storage/datetime-date-storage';
import { DataList } from '../dataList';
import { UrlBuilder } from '../url-builder';
import { FilterSerializer } from '../filter/filter-consumer-bridge-to-url-builder';
import { SqlDatabase } from '../data-providers/sql-database';
import { async } from '@angular/core/testing';
import { addFilterToUrlAndReturnTrueIfSuccessful } from '../data-providers/rest-data-provider';
import { OrFilter } from '../filter/filter-interfaces';
import { Categories as newCategories } from './remult-3-entities';
import { DateTimeColumn } from '@remult/core';
import { Column, Entity, EntityBase } from '../remult3';


export function itWithDataProvider(name: string, runAsync: (dpf: DataProvider, rows?: __RowsOfDataForTesting) => Promise<any>) {
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
export function fitWithDataProvider(name: string, runAsync: (dpf: DataProvider, rows?: __RowsOfDataForTesting) => Promise<any>) {
  let webSql = new WebSqlDataProvider('test');
  fitAsyncForEach<any>(name, [new InMemoryDataProvider(), new SqlDatabase(webSql)],
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
  it("filter on date keeps the type", () => {

  });
  it("finds its id column", () => {
    let c = new Context().for_old(Categories).create();
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
    let c = await (await createData(async insert => await insert(1, 'noam'))).findFirst();
    expect(c.categoryName).toBe('noam');
    expect(c._.columns.categoryName.originalValue).toBe('noam');
    c.categoryName = 'yael';
    expect(c.categoryName).toBe('yael');
    expect(c._.columns.categoryName.originalValue).toBe('noam');
    await c._.save();
    expect(c.categoryName).toBe('yael');
    expect(c._.columns.categoryName.originalValue).toBe('yael');

  });
  itAsync("Find or Create", async () => {
    let context = await (await createData());
    let row = await context.findOrCreate(x => x.id.isEqualTo(1));
    expect(row._.isNew()).toBe(true);
    expect(row.id).toBe(1);
    await row._.save();
    let row2 = await context.findOrCreate(x => x.id.isEqualTo(1));
    expect(row2._.isNew()).toBe(false);
    expect(row2.id).toBe(1);


  });

  it("object is autonemous", () => {
    let x = new Context().for(newCategories).create();
    let y = new Context().for(newCategories).create();
    x.categoryName = 'noam';
    y.categoryName = 'yael';
    expect(x.categoryName).toBe('noam');
    expect(y.categoryName).toBe('yael');
  })
  it("find the col value", () => {
    let x = new Context().for(newCategories).create();
    let y = new Context().for(newCategories).create();
    x.categoryName = 'noam';
    y.categoryName = 'yael';
    expect(y._.columns.find(x._.columns.categoryName).value).toBe('yael');
  });
  itAsync("can be saved to a pojo", async () => {
    let ctx = new Context().for(newCategories);
    let x = ctx.create();
    x.id = 1;
    x.categoryName = 'noam';
    let y = x._.toApiPojo();
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });
  // itAsync("json name is important", async () => {
  //   let ctx = new Context().for(newCategories);
  //   let x = ctx.create();
  //   x.id = 1;
  //   x.categoryName.defs.key = 'xx';
  //   x.categoryName = 'noam';
  //   let y = x._.toApiPojo();;
  //   expect(y.id).toBe(1);
  //   expect(y.xx).toBe('noam');
  // });
  // itAsync("json name is important 1", async () => {
  //   let ctx = new Context().for_old(myTestEntity);
  //   let x = ctx.create();
  //   x.id.value = 1;
  //   expect(x.name1.defs.key).toBe('name');
  //   x.name1.value = 'noam';
  //   let y = ctx.toApiPojo(x);
  //   expect(y.id).toBe(1);
  //   expect(y.name).toBe('noam', JSON.stringify(y));
  //   y.name = 'yael';
  //   new Context().for_old(myTestEntity)._updateEntityBasedOnApi(x, y);

  //   expect(x.name1.value).toBe('yael');

  // });
  // it("json name is important", () => {
  //   let x = new myTestEntity();
  //   x.id.value = 1;
  //   x.name1.value = 'a';
  //   var y = new myTestEntity();
  //   expect(x.columns.find(y.name1).value).toBe('a');


  // });

});
@Entity({ name: 'myTestEntity' })
class myTestEntity extends EntityBase {
  @Column()
  id: number;
  @Column({ key: 'name' })
  name1: string;
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
      let ctx = new ServerContext(dataProvider);
      let s = ctx.for(entityWithValidations);
      let c = s.create();
      c.myId = 1;
      c.name = 'noam';
      await c._.save();
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
      expect(x[0].name).toBe('noam');

    });
  itWithDataProvider("filter works on all db",
    async (dataProvider) => {

      let s = await create4RowsInDp(ctx, dataProvider);
      expect((await s.find({ where: c => c.myId.isIn([1, 3]) })).length).toBe(2);

    });
  itWithDataProvider("filter works on all db or",
    async (dataProvider) => {

      let s = await create4RowsInDp(ctx, dataProvider);
      expect((await s.find({ where: c => new OrFilter(c.myId.isEqualTo(1), c.myId.isEqualTo(3)) })).length).toBe(2);

    });

  itWithDataProvider("put with validations on column fails", async (dp) => {
    ctx = new ServerContext(dp);
    var s = ctx.for(entityWithValidationsOnColumn);
    let c = s.create();

    c.myId = 1;
    c.name = 'noam';
    await c._.save();
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
    expect(x[0].name).toBe('noam');

  });
  itWithDataProvider("put with validations on entity fails", async (dp) => {
    ctx = new ServerContext(dp);
    var s = ctx.for(entityWithValidations);
    let c = s.create();

    c.myId = 1; c.name = 'noam';
    await c._.save();
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
    expect(x[0].name).toBe('noam');

  });
  itWithDataProvider("entity with different id column still works well", async (dp) => {
    ctx = new ServerContext(dp);
    let s = ctx.for(entityWithValidations);
    let c = s.create();

    c.myId = 1; c.name = 'noam';
    await c._.save();
    c.name = 'yael';
    await c._.save();
    expect(c.name).toBe('yael');
    expect((await s.find()).length).toBe(1);


  });
  itWithDataProvider("empty find works", async (dp) => {
    let ctx = new ServerContext();
    ctx.setDataProvider(dp);
    let c = ctx.for(newCategories).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    let l = await ctx.for(newCategories).find();
    expect(l.length).toBe(1);
    expect(l[0].categoryName).toBe('test');


  });
  itAsync("test number is always number", async () => {
    let amount = new NumberColumn();
    let total = new NumberColumn();
    total.value = 10;
    amount.__valueProvider = {
      getValue: (a, b) => '15',
      getOriginalValue: () => '15',
      getEntity: () => undefined,
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

    var api = new DataApi(ctx.for(newCategories));
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
  if (false)
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
  if (false)
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
  // fitAsync("get array works with filter in body", async () => {
  //   let c = await createData(async (i) => {
  //     await i(1, 'noam', undefined, Status.open);
  //     await i(2, 'yael', undefined, Status.closed);
  //     await i(3, 'yoni', undefined, Status.hold);
  //   });
  //   var api = new DataApi(c);
  //   let t = new TestDataApiResponse();
  //   let d = new Done();
  //   t.success = data => {
  //     expect(data.length).toBe(2);
  //     expect(data[0].id).toBe(2);
  //     expect(data[1].id).toBe(3);
  //     d.ok();
  //   };
  //   await api.getArray(t, {
  //     get: x => {
  //       return undefined;
  //     }, clientIp: '', user: undefined, getHeader: x => ""
  //     , getBaseUrl: () => ''
  //   }, {
  //     status_in: '[1, 2]'
  //   });
  //   d.test();
  // });
  // itAsync("get array works with filter in body and in array statement", async () => {
  //   let c = await createData(async (i) => {
  //     await i(1, 'noam', undefined, Status.open);
  //     await i(2, 'yael', undefined, Status.closed);
  //     await i(3, 'yoni', undefined, Status.hold);
  //   });
  //   var api = new DataApi(c);
  //   let t = new TestDataApiResponse();
  //   let d = new Done();
  //   t.success = data => {
  //     expect(data.length).toBe(2);
  //     expect(data[0].id).toBe(2);
  //     expect(data[1].id).toBe(3);
  //     d.ok();
  //   };
  //   await api.getArray(t, {
  //     get: x => {
  //       return undefined;
  //     }, clientIp: '', user: undefined, getHeader: x => ""
  //     , getBaseUrl: () => ''
  //   }, {
  //     status_in: [1, 2]
  //   });
  //   d.test();
  // });
  // itAsync("get array works with filter in body and or statement", async () => {
  //   let c = await createData(async (i) => {
  //     await i(1, 'noam', undefined, Status.open);
  //     await i(2, 'yael', undefined, Status.closed);
  //     await i(3, 'yoni', undefined, Status.hold);
  //   });
  //   var api = new DataApi(c);
  //   let t = new TestDataApiResponse();
  //   let d = new Done();
  //   t.success = data => {
  //     expect(data.length).toBe(2);
  //     expect(data[0].id).toBe(2);
  //     expect(data[1].id).toBe(3);
  //     d.ok();
  //   };
  //   await api.getArray(t, {
  //     get: x => {
  //       return undefined;
  //     }, clientIp: '', user: undefined, getHeader: x => ""
  //     , getBaseUrl: () => ''
  //   }, {
  //     OR: [
  //       { status: 1 },
  //       { status: 2 }
  //     ]
  //   });
  //   d.test();
  // });
  itAsync("entity order by works", async () => {

    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      name: '', defaultOrderBy: x => x.categoryName,
      extends: newCategories
    })(type);
    let c = await createData(async insert => {
      await insert(1, 'noam');
      await insert(2, "yoni");
      await insert(3, "yael");
    }, type);

    var x = await c.find();
    expect(x[0].id).toBe(1);
    expect(x[1].id).toBe(3);
    expect(x[2].id).toBe(2);

  });
  itAsync("delete with validation fails", async () => {
    let context = new Context();
    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      name: undefined,
      extends: newCategories,
      allowApiDelete: true,
      deleted: () => happend = true,
      deleting: (t) => {
        deleting.ok();
        t._.columns.categoryName.error = 'err';
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'),
      type);

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
    expect(x[0].categoryName).toBe('noam');
  });
  itAsync("delete with validation exception fails", async () => {

    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories {

    }
    Entity<typeof type.prototype>({
      name: undefined,
      allowApiDelete: true,
      extends: newCategories,
      deleted: () => happend = true,
      deleting: () => {
        deleting.ok();
        throw 'err';
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);

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
    expect(x[0].categoryName).toBe('noam');
  });
  itAsync("delete with validation exception fails - no data api", async () => {
    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      name: undefined,
      extends: newCategories,
      allowApiDelete: true,
      deleted: () => happend = true,
      deleting: () => {
        deleting.ok();
        throw 'err';
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'),
      type);
    let h2 = false;
    let h3 = false;
    try {
      await (await c.findId(1))._.delete();
      h2 = true;
    } catch {
      h3 = true;
    }
    expect(h2).toBe(false);
    expect(h3).toBe(true);

  });
  itAsync("delete works", async () => {
    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: undefined,
      allowApiDelete: true,
      deleted: (t) => {
        happend = true;
        expect(t.id).toBe(1)
      },
      deleting: () => {
        deleting.ok();
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);

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
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: undefined,
      allowApiUpdate: true,
      saving: t => {
        count++;
        if (t.categoryName.includes('1'))
          t._.columns.categoryName.error = 'err';
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);
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
    expect(x[0].categoryName).toBe('noam');
    expect(count).toBe(1);

  });
  itAsync("put with validation works", async () => {
    let context = new Context();
    let count = 0;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: undefined,
      allowApiUpdate: true,
      saving: () => count++
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);


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
    expect(x[0].categoryName).toBe('noam 1');
    expect(count).toBe(1);

  });
  itAsync("afterSave works", async () => {
    let context = new Context();
    let count = 0;
    let startTest = false;
    let savedWorked = new Done();
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: undefined,
      allowApiUpdate: true,
      saving: () => count++,
      saved: (t) => {
        if (!startTest)
          return;
        savedWorked.ok();
        expect(t._.columns.categoryName.originalValue).toBe('noam');
        expect(t.categoryName).toBe('noam 1');
      }
    })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);


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
    expect(x[0].categoryName).toBe('noam 1');
    expect(count).toBe(1);

  });
  itAsync("afterSave works on insert", async () => {

    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: undefined,
      allowApiUpdate: true,
      allowApiInsert: true,

      saved: (t) => {
        savedWorked.ok();
        expect(t._.isNew()).toBe(true);
        expect(t._.columns.categoryName.originalValue).toBe(undefined);
        expect(t.categoryName).toBe('noam 1');
      }
    })(type);
    let c = await createData(async insert => { }, type);

    let savedWorked = new Done();

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
    expect(x[0].categoryName).toBe('noam 1');


  });
  itAsync("put with disable save still works", async () => {


    let startTest = false;
    let context = new ServerContext();
    let mem = new InMemoryDataProvider();
    context.setDataProvider(mem);
    let type = class extends newCategories {

    }
    Entity<typeof type.prototype>({
      extends: newCategories,
      name: 'testE',
      allowApiUpdate: true,
      saving: (row, cancel) => {
        if (startTest) {

          mem.rows["testE"][0].categoryName = 'kuku';
          expect(mem.rows["testE"][0].categoryName).toBe('kuku');
          cancel();
        }
      }
    })(type);

    {

      let c = context.for(type).create();
      c.id = 1;
      c.categoryName = 'name';
      c.description = "noam";
      await c._.save();

    };


    var api = new DataApi(context.for(type));
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
    var x = await context.for(type).find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName).toBe('kuku');


  });
  itAsync("get based on id with excluded columns", async () => {
    let context = new Context();

    let type = class extends newCategories {

      categoryName: string;
    };
    Column({ includeInApi: false })(type.prototype, "categoryName");
    Entity({ name: '', extends: newCategories })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);

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

    let c = await createData(async insert => await insert(1, 'noam'));
    let a = await c.findId(1);
    let b = await c.findId(1);
    a.categoryName = "yael";
    await a._.save();
    expect(b.categoryName).toBe('noam');
    await b._.reload();
    expect(b.categoryName).toBe('yael');
  });

  itAsync("put updates", async () => {
    let context = new Context();

    let c = await createData(async insert => await insert(1, 'noam'));

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
    expect(x[0].categoryName).toBe('noam 1');

  });
  itAsync("put updates and readonly columns", async () => {
    let context = new Context();
    let type = class extends newCategories {

      categoryName: string;
    };
    Column({ allowApiUpdate: false })(type.prototype, "categoryName");
    Entity({ name: '', allowApiUpdate: true, extends: newCategories })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);

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
    expect(x[0].categoryName).toBe('noam');

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
    let type = class extends newCategories {

      categoryName: string;
    };
    Column({ includeInApi: false })(type.prototype, "categoryName");
    Entity({ name: '', allowApiUpdate: true, extends: newCategories })(type);
    let c = await createData(async insert => await insert(1, 'noam'), type);


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
    expect(x[0].categoryName).toBe('noam');

  });
  itAsync("post with syntax error fails well", async () => {
    let type = class extends newCategories { };
    Entity<newCategories>({
      extends: newCategories,
      name: '',
      allowApiInsert: true,
      saving: (x) => x.description.length + 1
    })(type);
    let c = await createData(async insert => { }, type);


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
        if (x == c.create()._.columns.categoryName.key + '_contains')
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
        if (x == c.create()._.columns.categoryName.key + '_st')
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
        if (x == c.create()._.columns.description.key)
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();
  });
  if (false)
  // itAsync("allow api read depends also on api crud", async () => {
  //   let sc = new ServerContext();
  //   expect(sc.for_old(class extends Entity {
  //     constructor() {
  //       super({ name: 'a', allowApiCRUD: false })
  //     }
  //   })._getApiSettings().allowRead).toBe(false);
  // });
  // itAsync("allow api read depends also on api crud", async () => {
  //   let sc = new ServerContext();
  //   expect(sc.for_old(class extends Entity {
  //     constructor() {
  //       super({ name: 'a', allowApiCRUD: false, allowApiRead: true })
  //     }
  //   })._getApiSettings().allowRead).toBe(true);
  //});




  itAsync("delete id  not Allowed", async () => {
    let type = class extends newCategories {

    };
    Entity({
      name: '',
      extends: newCategories,
      allowApiDelete: false
    })(type);
    let c = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
  });
  if (false)
  itAsync("apiRequireId", async () => {
    let type = class extends newCategories {

    };
    Entity({
      name: '',
      extends: newCategories,
      apiRequireId: true
    })(type);
    let c = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "categoryName")
          return "a";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();

    t = new TestDataApiResponse();
    d = new Done();
    t.success = () => {
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "id")
          return "1";
        return undefined;
      }, clientIp: '', user: undefined, getHeader: x => ""
      , getBaseUrl: () => ''
    });
    d.test();

    t = new TestDataApiResponse();
    d = new Done();
    t.success = () => {
      d.ok();
    };
    await api.get(t, 1);
    d.test();

  });
  itAsync("delete id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      name: '',
      extends: newCategories,
      allowApiDelete: (c, t) => {
        return t.id == 1;
      }
    })(type);
    let c = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
    t = new TestDataApiResponse();
    d = new Done();
    t.deleted = () => d.ok();
    await api.delete(t, 1);
    d.test();
  });
  itAsync("update id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      name: '',
      extends: newCategories,
      allowApiUpdate: (c, t) => {
        return t.id == 1;
      }
    })(type);
    let c = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.put(t, 2,
      {
        categoryName: 'noam 1'
      });
    d.test();
    t = new TestDataApiResponse();
    d = new Done();
    t.success = () => d.ok();
    await api.put(t, 1,
      {
        categoryName: 'noam 1'
      });
    d.test();
  });
  itAsync("insert id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      name: '',
      extends: newCategories,
      allowApiInsert: (c, t) => {
        return t.categoryName == 'ok';
      }
    })(type);
    let c = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.methodNotAllowed = () => {
      d.ok();
    };
    await api.post(t,
      {
        categoryName: 'wrong'
      });
    d.test();
    t = new TestDataApiResponse();
    d = new Done();
    t.created = () => d.ok();
    await api.post(t,
      {
        categoryName: 'ok'
      });
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
    let c = new Context().for_old(Categories).create();
    expect(c.columns.toArray().length).toBe(6);

  });



  itWithDataProvider("count", async (dp) => {
    let ctx = new ServerContext();
    ctx.setDataProvider(dp);
    expect(await ctx.for(newCategories).count()).toBe(0);
    let c = ctx.for(newCategories).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    expect(await ctx.for(newCategories).count()).toBe(1);
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
    expect(addFilterToUrlAndReturnTrueIfSuccessful({ or: [{ a: 1 }, { a: 3 }] }, url)).toBe(false);
  });
});
describe("column validation", () => {
  it("validation clears on reset", () => {
    let c = new Context().for(newCategories).create();
    expect(c._.isValid()).toBe(true);
    c._.columns.id.error = "x";
    expect(c._.columns.id.error).toBe("x");
    expect(c._.isValid()).toBe(false);
    c._.undoChanges();
    expect(c._.columns.id.error).toBe(undefined);
    expect(c._.isValid()).toBe(true);
  });
  it("validation clears on change", () => {
    let c = new Context().for(newCategories).create();
    expect(c._.isValid()).toBe(true);
    c._.columns.id.error = "x";
    expect(c._.isValid()).toBe(false);
    expect(c._.columns.id.error).toBe("x");
    c.id = 1;
    //expect(c._.isValid()).toBe(true);
    //expect(c._.columns.id.error).toBe(undefined);
  });
  itAsync("test date filter and values", async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'));
    let c = new Context();
    await sql.execute("drop table if exists t1");
    c.setDataProvider(sql);
    let type = class extends EntityBase {
      id: number;
      name: string;
      c3: Date
    }
    Entity({
      name: 't1',
      dbAutoIncrementId: true
    })(type);
    Column({ type: Number })(type.prototype, "id");
    Column()(type.prototype, "name");
    Column({ type: Date })(type.prototype, "c3");

    let f = c.for(type);
    let d = new Date(2020, 1, 2, 3, 4, 5, 6);
    let p = f.create();
    p.name = '1';
    p.c3 = d;
    await p._.save();
    p = await f.findFirst(x => x.c3.isEqualTo(d));
    expect(p.name).toBe('1');
  });

});
describe("test web sql identity", () => {
  itAsync("play", async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'));
    let c = new Context();
    await sql.execute("drop table if exists t1");
    c.setDataProvider(sql);
   
    let type = class extends EntityBase {
      id: number;
      name: string;
      
    }
    Entity({
      name: 't1',
      dbAutoIncrementId: true
    })(type);
    Column({ type: Number })(type.prototype, "id");
    Column()(type.prototype, "name");
    

    let f = c.for(type);
    let t = f.create();
    t.name = 'a';
    await t._.save();
    expect(t.id).toBe(1);
    t = f.create();
    t.name = 'b';
    await t._.save();
    expect(t.id).toBe(2);
  });
});
describe("compound id", () => {
  return;
  itAsync("compund sql",
    async () => {
      let sql = new SqlDatabase(new WebSqlDataProvider('compound'));
      let ctx = new Context();
      ctx.setDataProvider(sql);

      let cod = ctx.for(CompoundIdEntity);
      for (const od of await cod.find({ where: od => od.a.isEqualTo(99) })) {
        await od._.delete();
      }
      let od = cod.create();
      od.a = 99;
      od.b = 1;
      await od._.save();
      od = await cod.findFirst({ where: od => od.a.isEqualTo(99) });
      od.c = 5;
      await od._.save();
      await od._.delete();

    });
  const ctx = new Context();
  itAsync("start", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new ServerContext(mem);
    let s = ctx.for(CompoundIdEntity);

    mem.rows[s.defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await s.find();
    expect(r.length).toBe(2);
    expect(r[0].a).toBe(1);
    expect(r[0].id).toBe('1,11');
    r = await s.find({ where: c => c.id.isEqualTo('1,11') });

    expect(r.length).toBe(1);
    expect(r[0].a).toBe(1);
  });
  

  itAsync("update", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new ServerContext(mem);
    let c = ctx.for(CompoundIdEntity);
    mem.rows[c.defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.find();
    expect(r[0].c).toBe(111);
    r[0].c = 55;
    expect(r[0]._.columns.c.originalValue).toBe(111);
    let saved = await r[0]._.save();

    expect(r[0].c).toBe(55);


    expect(mem.rows[c.defs.name][0].c).toBe(55);
    expect(mem.rows[c.defs.name][0].id).toBe(undefined);
    expect(r[0].id).toBe('1,11');
  });
  itAsync("update2", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new ServerContext(mem);
    let c = ctx.for(CompoundIdEntity);
    mem.rows[c.defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    var r = await c.find();
    r[0].b = 55;
    let saved = await r[0]._.save();


    expect(mem.rows[c.defs.name][0].b).toBe(55);
    expect(mem.rows[c.defs.name][0].id).toBe(undefined);
    expect(r[0].id).toBe('1,55');
  });
  itAsync("insert", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new ServerContext(mem);
    let c = ctx.for(CompoundIdEntity).create();
    mem.rows[ctx.for(CompoundIdEntity).defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    c.a = 3;
    c.b = 33;
    c.c = 3333;
    await c._.save();
    expect(mem.rows[ctx.for(CompoundIdEntity).defs.name][2].b).toBe(33);
    expect(mem.rows[ctx.for(CompoundIdEntity).defs.name][2].id).toBe(undefined);
    expect(c.id).toBe('3,33');
  });
  itAsync("delete", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new ServerContext(mem);
    let c = ctx.for(CompoundIdEntity);
    mem.rows[c.defs.name].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });

    let r = await c.find();
    await r[1]._.delete();
    expect(mem.rows[c.defs.name].length).toBe(1);
    expect(mem.rows[c.defs.name][0].a).toBe(1);
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
    await rl.items[1]._.delete();
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
  // it("dbname of entity can use column names", () => {
    
    
  //   expect(new ServerContext().for(EntityWithLateBoundDbName).defs.getDbName()).toBe('(select CategoryID)');
  // });

  itAsync("delete fails nicely", async () => {

    let cont = new ServerContext();
    cont.setDataProvider({
      getEntityDataProvider: x => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }, { id: 2 }, { id: 3 }]);
        r.delete = id => { return Promise.resolve().then(() => { throw Promise.resolve("error"); }) };
        return r;
      }, transaction: undefined
    });
    let rl = new DataList(cont.for(newCategories));
    await rl.get();
    expect(rl.items.length).toBe(3);
    try {
      await rl.items[1]._.delete();
      fail("was not supposed to get here");
    }
    catch (err) {
      expect(rl.items.length).toBe(3);
      expect(rl.items[1]._.validationError).toBe("error");
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

describe("test number negative", () => {
  it("negative", () => {
    let nc = new NumberColumn();
    nc.inputValue = '-';
    expect(nc.value).toBe(0);
    expect(nc.inputValue).toBe('-');
    nc.value = 1;
    expect(nc.inputValue).toBe('1');
  });
  it("negative2", () => {
    let nc = new NumberColumn();
    nc.inputValue = '2-1';
    expect(nc.value).toBe(0);
    expect(nc.inputValue).toBe('0');
  });
  it("negative decimal", () => {
    let nc = new NumberColumn();
    nc.inputValue = '-0.00';
    expect(nc.value).toBe(0);
    expect(nc.inputValue).toBe('-0.00');
    nc.inputValue = '-0.001';
    expect(nc.value).toBe(-0.001);
    expect(nc.inputValue).toBe('-0.001');

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
  c.setUser({ id: 'x', name: 'y', roles: [strA, strB] }
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
    c.setUser(undefined);
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
@Entity<CompoundIdEntity>({ name: 'compountIdEntity', id: x => [x.a, x.b] })
class CompoundIdEntity extends EntityBase {
  @Column()
  a: number;
  @Column()
  b: number;
  @Column()
  c: number;
  id = {};
}
@Entity<entityWithValidations>({
  name: '',
  allowApiCRUD: true,
  saving: async (t) => {
    if (!t.name || t.name.length < 3)
      t._.columns.name.error = 'invalid';

    if (t._.isNew() && (!t.myId || t.myId == 0)) {
      let e = await t.context.for(entityWithValidations).find({
        orderBy: x => x.myId.descending,
        limit: 1
      });

      t.myId = e.length ? e[0].myId + 1 : 1;

    }
    entityWithValidations.savingRowCount++;

  }
})
export class entityWithValidations extends EntityBase {
  @Column()
  myId: number;
  @Column()
  name: string;
  static savingRowCount = 0;
  constructor(private context: Context) {
    super();
  }
}
@Entity({ name: '', allowApiUpdate: true })
export class entityWithValidationsOnColumn extends EntityBase {
  @Column()
  myId: number;
  @Column<entityWithValidations, string>({
    validate: (c, t) => {
      if (!t.name || t.name.length < 3)
        c.error = 'invalid on column';
    }
  })
  name: string;

}
@Entity<entityWithValidationsOnEntityEvent>({
  name: '',
  validation: (t => {
    if (!t.name || t.name.length < 3)
      t._.columns.name.error = 'invalid';
  })
})
export class entityWithValidationsOnEntityEvent extends EntityBase {
  @Column()
  myId: number;
  @Column()
  name: string;
}
@Entity<EntityWithLateBoundDbName>({
  name: 'stam',
  dbName: t => '(select ' + t.id.dbName + ')'
})
export class EntityWithLateBoundDbName extends EntityBase {
  @Column({ dbName: 'CategoryID' })
  id: number;

}

async function create4RowsInDp(ctx: Context, dataProvider: DataProvider) {
  ctx = new ServerContext(dataProvider);
  let s = ctx.for(entityWithValidations);
  let c = s.create();
  c.myId = 1;
  c.name = 'noam';
  await c._.save();
  c = s.create();
  c.myId = 2;
  c.name = 'yael';
  await c._.save();
  c = s.create();
  c.myId = 3;
  c.name = 'yoni';
  await c._.save();
  c = s.create();
  c.myId = 4;
  c.name = 'maayan';
  await c._.save();
  return s;
}
