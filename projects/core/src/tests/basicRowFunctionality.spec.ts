

import { createData, testAllDbs } from './RowProvider.spec';
import { DataApi, DataApiResponse } from '../data-api';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { itForEach, Done, fitForEach } from './testHelper.spec';

import { Status } from './testModel/models';

import { Remult, Allowed } from '../context';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { DataProvider } from '../data-interfaces';
import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting";
import { DataList } from '../../../angular/src/angular/dataList';
import { UrlBuilder } from '../../urlBuilder';

import { SqlDatabase } from '../data-providers/sql-database';
import { async } from '@angular/core/testing';
import { addFilterToUrlAndReturnTrueIfSuccessful, RestDataProvider } from '../data-providers/rest-data-provider';
import { entityFilterToJson, Filter, OrFilter } from '../filter/filter-interfaces';
import { Categories, Categories as newCategories, CategoriesForTesting } from './remult-3-entities';

import { Field, decorateColumnSettings, Entity, EntityBase, FieldType, IntegerField } from '../remult3';
import { DateOnlyValueConverter } from '../../valueConverters';
import { CompoundIdField } from '../column';
import { actionInfo } from '../server-action';

//SqlDatabase.LogToConsole = true;


export function itWithDataProvider(name: string, runAsync: (dpf: DataProvider, rows?: __RowsOfDataForTesting) => Promise<any>) {
  let webSql = new WebSqlDataProvider('test');
  itForEach<any>(name, [new InMemoryDataProvider(), new SqlDatabase(webSql)],
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
  fitForEach<any>(name, [new InMemoryDataProvider(), new SqlDatabase(webSql)],
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
  error(data) {
    fail('error: ' + data + " " + JSON.stringify(data));
  }

}

@FieldType<Phone>({
  valueConverter: {
    toJson: x => x.thePhone,
    fromJson: x => new Phone(x)
  }
})
class Phone {
  constructor(private thePhone) {

  }
}
@Entity({ key: '' })
class tableWithPhone extends EntityBase {
  @Field()
  id: number;
  @Field()
  phone: Phone;
}
describe("test object column stored as string", () => {
  it("was changed should work correctly", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let repo = remult.repo(tableWithPhone);
    let r = repo.create();
    r.id = 1;
    r.phone = new Phone("123");
    await r.save();
    r.phone = new Phone("123");
    expect(r.$.phone.valueChanged()).toBe(false);
    expect(r._.wasChanged()).toBe(false);


  });
});


@Entity({ key: 'testNumbers' })
class testNumbers extends EntityBase {
  @IntegerField()
  id: number;
  @Field()
  a: number;
}
describe("test numbers", () => {
  it("test that integer and int work", async () => {
    await testAllDbs(async ({ remult }) => {
      let e = await remult.repo(testNumbers).create({
        id: 1.5,
        a: 1.5
      }).save();
      expect(e.id).toBe(2);
      expect(e.a).toBe(1.5);

    });
  })
});


describe('Test basic row functionality', () => {
  it("filter on date keeps the type", () => {

  });
  it("finds its id column", () => {
    let c = new Remult().repo(newCategories);
    expect(c.metadata.idMetadata.field.key).toBe("id");
    let n = c.create();
    n.id = 5;
    expect(n._.getId()).toBe(5);

  });
  it("object assign works", () => {
    let a: any = {};
    let b: any = {};
    a.info = 3;
    Object.assign(b, a);
    expect(b.info).toBe(3);

  });
  it("Original values update correctly", async () => {
    let c = await (await createData(async insert => await insert(1, 'noam')))[0].findFirst();
    expect(c.categoryName).toBe('noam');
    expect(c._.fields.categoryName.originalValue).toBe('noam');
    c.categoryName = 'yael';
    expect(c.categoryName).toBe('yael');
    expect(c._.fields.categoryName.originalValue).toBe('noam');
    await c._.save();
    expect(c.categoryName).toBe('yael');
    expect(c._.fields.categoryName.originalValue).toBe('yael');

  });
  it("Find or Create", async () => {
    let [repo] = await (await createData());
    let row = await repo.findFirst({ createIfNotFound: true, where: x => x.id.isEqualTo(1) });
    expect(row._.isNew()).toBe(true);
    expect(row.id).toBe(1);
    await row._.save();
    let row2 = await repo.findFirst({ createIfNotFound: true, where: x => x.id.isEqualTo(1) });
    expect(row2._.isNew()).toBe(false);
    expect(row2.id).toBe(1);


  });

  it("object is autonemous", () => {
    let x = new Remult().repo(newCategories).create();
    let y = new Remult().repo(newCategories).create();
    x.categoryName = 'noam';
    y.categoryName = 'yael';
    expect(x.categoryName).toBe('noam');
    expect(y.categoryName).toBe('yael');
  })
  it("find the col value", () => {
    let x = new Remult().repo(newCategories).create();
    let y = new Remult().repo(newCategories).create();
    x.categoryName = 'noam';
    y.categoryName = 'yael';
    expect(y._.fields.find(x._.fields.categoryName.metadata).value).toBe('yael');
    expect(y._.fields.find(x._.fields.categoryName.metadata.key).value).toBe('yael');
    expect(y._.metadata.fields.find('categoryName').key).toBe('categoryName');
  });
  it("can be saved to a pojo", async () => {
    let ctx = new Remult().repo(newCategories);
    let x = ctx.create();
    x.id = 1;
    x.categoryName = 'noam';
    let y = x._.toApiJson();
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });
  // it("json name is important", async () => {
  //   let ctx = new Remult().for(newCategories);
  //   let x = ctx.create();
  //   x.id = 1;
  //   x.categoryName.defs.key = 'xx';
  //   x.categoryName = 'noam';
  //   let y = x._.toApiPojo();;
  //   expect(y.id).toBe(1);
  //   expect(y.xx).toBe('noam');
  // });
  // it("json name is important 1", async () => {
  //   let ctx = new Remult().for_old(myTestEntity);
  //   let x = ctx.create();
  //   x.id.value = 1;
  //   expect(x.name1.defs.key).toBe('name');
  //   x.name1.value = 'noam';
  //   let y = ctx.toApiPojo(x);
  //   expect(y.id).toBe(1);
  //   expect(y.name).toBe('noam', JSON.stringify(y));
  //   y.name = 'yael';
  //   new Remult().for_old(myTestEntity)._updateEntityBasedOnApi(x, y);

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
@Entity({ key: 'myTestEntity' })
class myTestEntity extends EntityBase {
  @Field()
  id: number;
  @Field({ key: 'name' })
  name1: string;
}

describe("data api", () => {
  beforeEach(() => actionInfo.runningOnServer = true);
  afterEach(() => actionInfo.runningOnServer = false);
  it("get based on id", async () => {


    let [c, remult] = await createData(async insert => await insert(1, 'noam'));

    var api = new DataApi(c, remult);
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

  it("get based on id virtual column", async () => {


    let [c, remult] = await createData(async insert => await insert(1, 'noam'));

    var api = new DataApi(c, remult);
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
  it("get based on id virtual column async", async () => {


    let [c, remult] = await createData(async insert => await insert(1, 'noam'));

    var api = new DataApi(c, remult);
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

  it("get based on id can fail", async () => {
    let [c, remult] = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.get(t, 2);
    d.test();
  });



  let ctx = new Remult();
  ctx.setDataProvider(new InMemoryDataProvider());
  itWithDataProvider("put with validations on entity fails",
    async (dataProvider) => {
      let ctx = new Remult();
      ctx.setDataProvider(dataProvider);
      let s = ctx.repo(entityWithValidations);
      let c = s.create();
      c.myId = 1;
      c.name = 'noam';
      await c._.save();
      let api = new DataApi(s, ctx);
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
    ctx = new Remult();
    ctx.setDataProvider(dp);
    var s = ctx.repo(entityWithValidationsOnColumn);
    let c = s.create();

    c.myId = 1;
    c.name = 'noam';
    await c._.save();
    let api = new DataApi(s, ctx);
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
    ctx = new Remult();
    ctx.setDataProvider(dp);
    var s = ctx.repo(entityWithValidations);
    let c = s.create();

    c.myId = 1; c.name = 'noam';
    await c._.save();
    let api = new DataApi(s, ctx);
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
    ctx = new Remult();
    ctx.setDataProvider(dp);
    let s = ctx.repo(entityWithValidations);
    let c = s.create();

    c.myId = 1; c.name = 'noam';
    await c._.save();
    c.name = 'yael';
    await c._.save();
    expect(c.name).toBe('yael');
    expect((await s.find()).length).toBe(1);


  });
  itWithDataProvider("empty find works", async (dp) => {
    let ctx = new Remult();
    ctx.setDataProvider(dp);
    let c = ctx.repo(newCategories).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    let l = await ctx.repo(newCategories).find();
    expect(l.length).toBe(1);
    expect(l[0].categoryName).toBe('test');


  });
  itWithDataProvider("parial updates", async (dp) => {
    let remult = new Remult();
    remult.setDataProvider(dp);
    let c = remult.repo(newCategories).create({
      id: 5, categoryName: 'test', description: 'desc'
    });
    await c._.save();
    let l = await remult.repo(newCategories).findId(5);
    c.categoryName = 'newname';
    l.description = 'new desc';
    await c.save();
    await l.save();
    expect(l.categoryName).toBe('newname');
    expect(l.description).toBe('new desc');


  });




  it("delete fails when not found", async () => {

    let [c, remult] = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.delete(t, 2);
    d.test();
  });
  it("delete works ", async () => {

    let [c, remult] = await createData(async insert => await insert(1, 'noam'));
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.deleted = () => d.ok();
    await api.delete(t, 1);

    let r = await c.find();
    expect(r.length).toBe(0);
  });
  it("delete falis nicely ", async () => {
    let ctx = new Remult();
    ctx.setDataProvider({
      getEntityDataProvider: (x) => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }]);
        r.delete = () => { throw "ERROR"; };
        return r;
      }, transaction: undefined
    });

    var api = new DataApi(ctx.repo(newCategories), ctx);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.error = () => d.ok();
    await api.delete(t, 1);

    d.test();
  });
  it("post works", async () => {



    let [c, remult] = await createData(async () => { });

    var api = new DataApi(c, remult);
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

  it("post with logic works and max in entity", async () => {
    await testAllDbs(async ({ remult }) => {
      let c = remult.repo(entityWithValidations);

      var api = new DataApi(c, remult);
      let t = new TestDataApiResponse();
      let d = new Done();
      t.created = async (data: any) => {
        expect(data.name).toBe('noam honig');
        expect(data.myId).toBe(1);
        d.ok();
      };
      entityWithValidations.savingRowCount = 0;
      await api.post(t, { name: 'noam honig', myId: 1 });
      expect(entityWithValidations.savingRowCount).toBe(1);
      d.test();
    })
  });

  it("post fails on duplicate index", async () => {


    let [c, remult] = await createData(async (i) => { await i(1, 'noam'); });

    var api = new DataApi(c, remult);
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

  it("getArray works", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
    });

    var api = new DataApi(c, remult);
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
  it("getArray works with filter", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
    });
    var api = new DataApi(c, remult);
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
      }
    });
    d.test();
  });
  it("getArray works with filter and multiple values", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
      await i(3, 'yoni');
    });
    var api = new DataApi(c, remult);
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
      }
    });
    d.test();
  });
  it("getArray works with filter and multiple values with closed list columns", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c, remult);
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
      }
    });
    d.test();
  });

  it("getArray works with filter and in with closed list columns", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c, remult);
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
      }
    });
    d.test();
  });
  it("get array works with filter in body", async () => {
    await testAllDbs(async ({ createData, remult }) => {
      let c = await createData(async (i) => {
        await i(1, 'noam', undefined, Status.open);
        await i(2, 'yael', undefined, Status.closed);
        await i(3, 'yoni', undefined, Status.hold);
      });
      var api = new DataApi(c, remult);
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
        }
      }, {
        status_in: '[1, 2]'
      });
      d.test();
    });
  });
  it("get array works with filter in body and in array statement", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c, remult);
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
      }
    }, {
      status_in: [1, 2]
    });
    d.test();
  });
  it("get array works with filter in body and or statement", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', undefined, Status.open);
      await i(2, 'yael', undefined, Status.closed);
      await i(3, 'yoni', undefined, Status.hold);
    });
    var api = new DataApi(c, remult);
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
      }
    }, {
      OR: [
        { status: 1 },
        { status: 2 }
      ]
    });
    d.test();
  });
  it("entity order by works", async () => {

    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      key: '',
      defaultOrderBy: x => x.categoryName,

    })(type);
    await testAllDbs(async ({ createData }) => {
      let c = await createData(async insert => {
        await insert(1, 'noam');
        await insert(2, "yoni");
        await insert(3, "yael");
      }, type);

      var x = await c.find();
      expect(x[0].id).toBe(1);
      expect(x[1].id).toBe(3);
      expect(x[2].id).toBe(2);
    })
  });
  it("delete with validation fails", async () => {

    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({
      key: undefined,

      allowApiDelete: true,
      deleted: () => happend = true,
      deleting: (t) => {
        deleting.ok();
        t._.fields.categoryName.error = 'err';
      }
    })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'),
      type);

    var api = new DataApi(c, remult);
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
  it("delete with validation exception fails", async () => {

    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories {

    }
    Entity<typeof type.prototype>({
      key: undefined,
      allowApiDelete: true,

      deleted: () => happend = true,
      deleting: () => {
        deleting.ok();
        throw 'err';
      }
    })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);

    var api = new DataApi(c, remult);
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
  it("delete with validation exception fails - no data api", async () => {
    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      key: undefined,

      allowApiDelete: true,
      deleted: () => happend = true,
      deleting: () => {
        deleting.ok();
        throw 'err';
      }
    })(type);
    let [c] = await createData(async insert => await insert(1, 'noam'),
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
  it("delete works", async () => {
    var deleting = new Done();
    let happend = false;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({

      key: undefined,
      allowApiDelete: true,
      deleted: (t) => {
        happend = true;
        expect(t.id).toBe(1)
      },
      deleting: () => {
        deleting.ok();
      }
    })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);

    var api = new DataApi(c, remult);
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

  it("put with validation fails", async () => {

    let count = 0;
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({

      key: undefined,
      allowApiUpdate: true,
      saving: t => {
        count++;
        if (t.categoryName.includes('1'))
          t._.fields.categoryName.error = 'err';
      }
    })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);
    var api = new DataApi(c, remult);
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
  it("put with validation works", async () => {
    await testAllDbs(async ({ createData, remult }) => {
      let count = 0;
      let type = class extends newCategories { };
      Entity<typeof type.prototype>({

        key: undefined,
        allowApiUpdate: true,
        saving: () => count++
      })(type);
      let c = await createData(async insert =>
        await insert(1, 'noam'), type);


      var api = new DataApi(c, remult);
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
      var x = await c.find({
        where: c => c.id.isEqualTo(1)
      });

      expect(x[0].categoryName).toBe('noam 1');
      expect(count).toBe(1);
    });
  });
  it("afterSave works", async () => {

    let count = 0;
    let startTest = false;
    let savedWorked = new Done();
    let type = class extends newCategories { };
    Entity<typeof type.prototype>({

      key: undefined,
      allowApiUpdate: true,
      saving: () => count++,
      saved: (t) => {
        if (!startTest)
          return;
        savedWorked.ok();
        expect(t._.fields.categoryName.originalValue).toBe('noam');
        expect(t.categoryName).toBe('noam 1');
      }
    })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);


    var api = new DataApi(c, remult);
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
  it("afterSave works on insert", async () => {

    let type = class extends newCategories { };
    Entity<typeof type.prototype>({

      key: undefined,
      allowApiUpdate: true,
      allowApiInsert: true,

      saved: (t) => {
        savedWorked.ok();
        expect(t._.isNew()).toBe(true);
        expect(t._.fields.categoryName.originalValue).toBe(undefined);
        expect(t.categoryName).toBe('noam 1');
      }
    })(type);
    let [c, remult] = await createData(async insert => { }, type);

    let savedWorked = new Done();

    var api = new DataApi(c, remult);
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
  it("put with disable save still works", async () => {


    let startTest = false;
    let remult = new Remult();
    let mem = new InMemoryDataProvider();
    remult.setDataProvider(mem);
    let type = class extends newCategories {

    }
    Entity<typeof type.prototype>({

      key: 'testE',
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

      let c = remult.repo(type).create();
      c.id = 1;
      c.categoryName = 'name';
      c.description = "noam";
      await c._.save();

    };


    var api = new DataApi(remult.repo(type), remult);
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
    var x = await remult.repo(type).find({ where: c => c.id.isEqualTo(1) });
    expect(x[0].categoryName).toBe('kuku');


  });
  it("get based on id with excluded columns", async () => {


    let type = class extends newCategories {

      categoryName: string;
    };
    Field({ includeInApi: false })(type.prototype, "categoryName");
    Entity({ key: '' })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);

    var api = new DataApi(c, remult);
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
  it("row reload", async () => {

    let [c, remult] = await createData(async insert => await insert(1, 'noam'));
    let a = await c.findId(1);
    let b = await c.findId(1, { useCache: false });
    a.categoryName = "yael";
    await a._.save();
    expect(b.categoryName).toBe('noam');
    await b._.reload();
    expect(b.categoryName).toBe('yael');
    expect(b._.wasChanged()).toBe(false);
    expect(b.$.categoryName.originalValue).toBe('yael');
  });
  it("Find null works", async () => {
    let [c, remult] = await createData(async insert => await insert(1, 'noam'));
    expect(await c.findId(null)).toBeNull();
    expect(await c.findId(undefined)).toBeNull();
  });

  it("put updates", async () => {
    let [c, remult] = await createData(async insert => await insert(1, 'noam'));

    var api = new DataApi(c, remult);
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
  it("put updates and readonly columns", async () => {
    let type = class extends newCategories {

      categoryName: string;
    };
    Field({ allowApiUpdate: false })(type.prototype, "categoryName");
    Entity({ key: '', allowApiUpdate: true })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);

    var api = new DataApi(c, remult);
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
  it("put fails when not found", async () => {

    let [c, remult] = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.put(t, 2, {});
    d.test();

  });
  it("put updates", async () => {
    let type = class extends newCategories {

      categoryName: string;
    };
    Field({ includeInApi: false })(type.prototype, "categoryName");
    Entity({ key: '', allowApiUpdate: true })(type);
    let [c, remult] = await createData(async insert => await insert(1, 'noam'), type);


    var api = new DataApi(c, remult);
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
  it("post with syntax error fails well", async () => {
    let type = class extends newCategories { };
    Entity<newCategories>({

      key: '',
      allowApiInsert: true,
      saving: (x) => x.description.length + 1
    })(type);
    let [c, remult] = await createData(async insert => { }, type);


    var api = new DataApi(c, remult);
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
  it("getArray works with filter contains", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam');
      await i(2, 'yael');
      await i(3, 'yoni');
    });
    var api = new DataApi(c, remult);
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
        if (x == c.create()._.fields.categoryName.metadata.key + '_contains')
          return "a";
        return undefined;
      }
    });
    d.test();
  });
  it("getArray works with filter startsWith", async () => {
    await testAllDbs(async ({ createData, remult }) => {
      let c = await createData(async (i) => {
        await i(1, 'noam');
        await i(2, 'yael');
        await i(3, 'yoni');
      });
      var api = new DataApi(c, remult);
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
          if (x == c.create()._.fields.categoryName.metadata.key + '_st')
            return "y";
          return undefined;
        }
      });
      d.test();
    })
  });
  it("getArray works with predefined filter", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    });
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = data => {
      expect(data.length).toBe(2);
      expect(data[0].id).toBe(1);
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == c.create()._.fields.description.metadata.key)
          return "a";
        return undefined;
      }
    });
    d.test();
  });

  it("allow api read depends also on api crud", async () => {
    let sc = new Remult();
    let type = class extends EntityBase {

    }
    Entity({ allowApiCrud: false, key: 'a' })(type);
    expect(new DataApi(sc.repo(type), sc)._getApiSettings().allowRead).toBe(false);
  });
  it("allow api read depends also on api crud", async () => {
    let sc = new Remult();
    let type = class extends EntityBase {

    }
    Entity({ allowApiCrud: false, allowApiRead: true, key: 'a' })(type);
    expect(new DataApi(sc.repo(type), sc)._getApiSettings().allowRead).toBe(true);

  });




  it("delete id  not Allowed", async () => {
    let type = class extends newCategories {

    };
    Entity({
      key: '',

      allowApiDelete: false
    })(type);
    let [c, remult] = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.forbidden = () => {
      d.ok();
    };
    await api.delete(t, 2);
    d.test();
  });

  it("apiRequireId", async () => {
    let type = class extends newCategories {

    };
    Entity({
      key: '',

      apiRequireId: true
    })(type);
    let [c, remult] = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.forbidden = () => {
      d.ok();
    };
    await api.getArray(t, {
      get: x => {
        if (x == "categoryName")
          return "a";
        return undefined;
      }
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
      }
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
  it("delete id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      key: '',

      allowApiDelete: (c, t) => {
        return t.id == 1;
      }
    })(type);
    let [c, remult] = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.forbidden = () => {
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
  it("update id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      key: '',

      allowApiUpdate: (c, t) => {
        return t.id == 1;
      }
    })(type);
    let [c, remult] = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);
    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.forbidden = () => {
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
  it("insert id  not Allowed for specific row", async () => {
    let type = class extends newCategories {

    };
    Entity<typeof type.prototype>({
      key: '',

      allowApiInsert: (c, t) => {
        return t.categoryName == 'ok';
      }
    })(type);
    let [c, remult] = await createData(async i => {
      await i(1, 'noam', 'a');
      await i(2, 'yael', 'b');
      await i(3, 'yoni', 'a');
    }, type);

    var api = new DataApi(c, remult);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.forbidden = () => {
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

  it("getArray works with sort", async () => {
    let [c, remult] = await createData(async (i) => {
      await i(1, 'a');
      await i(2, 'c');
      await i(3, 'b');
      await i(4, 'c');
    });
    var api = new DataApi(c, remult);
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
      }
    });
    d.test();
  });

  it("columnsAreOk", () => {
    let c = new Remult().repo(newCategories).create();
    expect([...c._.fields].length).toBe(6);

  });



  itWithDataProvider("count", async (dp) => {
    let ctx = new Remult();
    ctx.setDataProvider(dp);
    expect(await ctx.repo(newCategories).count()).toBe(0);
    let c = ctx.repo(newCategories).create();
    c.id = 5;
    c.categoryName = 'test';
    await c._.save();
    expect(await ctx.repo(newCategories).count()).toBe(1);
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
    let c = new Remult().repo(newCategories).create();
    expect(c._.hasErrors()).toBe(true);
    c._.fields.id.error = "x";
    expect(c._.fields.id.error).toBe("x");
    expect(c._.hasErrors()).toBe(false);
    c._.undoChanges();
    expect(c._.fields.id.error).toBe(undefined);
    expect(c._.hasErrors()).toBe(true);
  });
  it("validation clears on change", () => {
    let c = new Remult().repo(newCategories).create();
    expect(c._.hasErrors()).toBe(true);
    c._.fields.id.error = "x";
    expect(c._.hasErrors()).toBe(false);
    expect(c._.fields.id.error).toBe("x");
    c.id = 1;
    //expect(c._.isValid()).toBe(true);
    //expect(c._.columns.id.error).toBe(undefined);
  });
  it("test date filter and values", async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'));
    let c = new Remult();
    await sql.execute("drop table if exists t1");
    c.setDataProvider(sql);
    let type = class extends EntityBase {
      id: number;
      name: string;
      c3: Date
    }
    Entity({
      key: 't1',
      dbAutoIncrementId: true
    })(type);
    IntegerField({ valueType: Number })(type.prototype, "id");
    Field()(type.prototype, "name");
    Field({ valueType: Date })(type.prototype, "c3");

    let f = c.repo(type);
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
  it("play", async () => {
    let sql = new SqlDatabase(new WebSqlDataProvider('identity_game'));
    let c = new Remult();
    await sql.execute("drop table if exists t1");
    c.setDataProvider(sql);

    let type = class extends EntityBase {
      id: number;
      name: string;

    }
    Entity({
      key: 't1',
      dbAutoIncrementId: true
    })(type);
    IntegerField({ valueType: Number })(type.prototype, "id");
    Field()(type.prototype, "name");


    let f = c.repo(type);
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
  it("id field is comound", () => {
    let ctx = new Remult();
    expect(ctx.repo(CompoundIdEntity).metadata.idMetadata.field instanceof CompoundIdField).toBe(true);
  });
  it("compound sql",
    async () => {
      let sql = new SqlDatabase(new WebSqlDataProvider('compound'));
      let ctx = new Remult();
      ctx.setDataProvider(sql);

      let cod = ctx.repo(CompoundIdEntity);
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
  const ctx = new Remult();
  it("start", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new Remult();
    ctx.setDataProvider(mem);

    let s = ctx.repo(CompoundIdEntity);

    mem.rows[s.metadata.key] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];


    var r = await s.find();
    expect(r.length).toBe(2);
    expect(r[0].a).toBe(1);
    expect(r[0]._.getId()).toBe('1,11');
    r = await s.find({ where: c => s.metadata.idMetadata.getIdFilter('1,11') });

    expect(r.length).toBe(1);
    expect(r[0].a).toBe(1);
  });


  it("update", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new Remult();
    ctx.setDataProvider(mem);
    let c = ctx.repo(CompoundIdEntity);
    mem.rows[c.metadata.key] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];


    var r = await c.find();
    expect(r[0].c).toBe(111);
    r[0].c = 55;
    expect(r[0]._.fields.c.originalValue).toBe(111);
    let saved = await r[0]._.save();

    expect(r[0].c).toBe(55);


    expect(mem.rows[c.metadata.key][0].c).toBe(55);
    expect(mem.rows[c.metadata.key][0].id).toBe(undefined);
    expect(r[0]._.getId()).toBe('1,11');
  });
  it("update2", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new Remult();
    ctx.setDataProvider(mem);
    let c = ctx.repo(CompoundIdEntity);

    mem.rows[c.metadata.key] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];


    var r = await c.find();
    r[0].b = 55;
    let saved = await r[0]._.save();


    expect(mem.rows[c.metadata.key][0].b).toBe(55);
    expect(mem.rows[c.metadata.key][0].id).toBe(undefined);

    expect(r[0]._.getId()).toBe('1,55');
  });
  it("insert", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new Remult();
    ctx.setDataProvider(mem);
    let c = ctx.repo(CompoundIdEntity).create();
    mem.rows[ctx.repo(CompoundIdEntity).metadata.key].push({ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 });


    c.a = 3;
    c.b = 33;
    c.c = 3333;
    await c._.save();
    expect(mem.rows[ctx.repo(CompoundIdEntity).metadata.key][2].b).toBe(33);
    expect(mem.rows[ctx.repo(CompoundIdEntity).metadata.key][2].id).toBe(undefined);
    expect(c._.getId()).toBe('3,33');
  });
  it("delete", async () => {
    let mem = new InMemoryDataProvider();
    let ctx = new Remult();
    ctx.setDataProvider(mem);
    let c = ctx.repo(CompoundIdEntity);
    mem.rows[c.metadata.key] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];

    let r = await c.find();
    await r[1]._.delete();
    expect(mem.rows[c.metadata.key].length).toBe(1);
    expect(mem.rows[c.metadata.key][0].a).toBe(1);
  });

});
describe("test data list", () => {
  it("delete works", async () => {
    let [c] = await createData(async i => {
      await i(1, 'a');
      await i(2, 'b');
      await i(3, 'c');
    });
    let rl = new DataList<CategoriesForTesting>(c);
    await rl.get();
    expect(rl.items.length).toBe(3);
    await rl.items[1]._.delete();
    expect(rl.items.length).toBe(2);
  });


  it("dbname of entity string works", async () => {
    let type = class extends Categories {

    }
    Entity({ key: 'testName', dbName: 'test' })(type);
    let r = new Remult().repo(type);
    expect((await r.metadata.getDbName())).toBe('test');
  });
  it("dbname of entity can use column names", async () => {

    let r = new Remult().repo(EntityWithLateBoundDbName);
    expect((await r.metadata.getDbName())).toBe('(select CategoryID)');
  });


  it("delete fails nicely", async () => {

    let cont = new Remult();
    cont.setDataProvider({
      getEntityDataProvider: x => {
        let r = new ArrayEntityDataProvider(x, [{ id: 1 }, { id: 2 }, { id: 3 }]);
        r.delete = id => { return Promise.resolve().then(() => { throw Promise.resolve("error"); }) };
        return r;
      }, transaction: undefined
    });
    let rl = new DataList<newCategories>(cont.repo(newCategories));
    await rl.get();
    expect(rl.items.length).toBe(3);
    try {
      await rl.items[1]._.delete();
      fail("was not supposed to get here");
    }
    catch (err) {
      expect(rl.items.length).toBe(3);
      expect(rl.items[1]._.error).toBe("error");
    }
  });

});
describe("test date storage", () => {
  it("works", () => {
    let val = "1976-06-16";
    /** */
    var d: Date = DateOnlyValueConverter.fromJson(val);
    expect(d.getFullYear()).toBe(1976);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(16);

  });
  it("works", () => {

    let val = new Date(1976, 5, 16);
    expect(DateOnlyValueConverter.toJson(val)).toBe('1976-06-16')
  });
});
describe("test bool value", () => {
  it("should work", () => {
    let col = decorateColumnSettings<Boolean>({ valueType: Boolean }, new Remult());
    expect(col.valueConverter.fromJson(true)).toBe(true);
    expect(col.valueConverter.fromJson(false)).toBe(false);
  });
  it("saves correctoly to db", async () => {
    await testAllDbs(async ({ remult }) => {
      let type = class extends EntityBase {
        id: number;
        ok: Boolean = false;
      }
      Entity({ key: 'asdf' })(type);
      Field({
        valueType: Number
      })(type.prototype, 'id');
      Field({ valueType: Boolean })(type.prototype, "ok");
      let r = remult.repo(type).create();
      r.id = 1;
      r.ok = true;
      await r._.save();
      expect(r.ok).toBe(true);
      r.ok = false;
      await r._.save();
      expect(r.ok).toBe(false);
    });
  });
  it("saves correctly to db", async () => {
    await testAllDbs(async ({ remult }) => {
      let type = class extends EntityBase {
        id: number;
        ok: Boolean = false;
      }
      Entity<typeof type.prototype>({
        key: 'asdf', saving: (x) => {
          x.ok = true;
        }
      })(type);
      Field({
        valueType: Number
      })(type.prototype, 'id');
      Field({ valueType: Boolean })(type.prototype, "ok");
      let r = remult.repo(type).create();
      r.id = 1;
      expect(r.ok).toBe(false);
      await r._.save();
      expect(r.ok).toBe(true);

    });
  });


});

describe("test number negative", () => {
  // it("negative", () => {
  //   let nc = decorateColumnSettings<number>({ dataType: Number });
  //   expect(nc.valueConverter.toInput(nc.valueConverter.fromInput("-", ''), '')).toBe("-");
  // });
  // it("negative2", () => {
  //   let nc = decorateColumnSettings<number>({ dataType: Number });;
  //   expect(nc.valueConverter.fromInput('2-1', '')).toBe(0);
  // });
  // it("negative decimal", () => {
  //   let nc = new NumberColumn();
  //   nc.inputValue = '-0.00';
  //   expect(nc.value).toBe(0);
  //   expect(nc.inputValue).toBe('-0.00');
  //   nc.inputValue = '-0.001';
  //   expect(nc.value).toBe(-0.001);
  //   expect(nc.inputValue).toBe('-0.001');

  // });

});

describe("test rest data provider translates data correctly", () => {
  it("get works", async () => {
    let type = class extends EntityBase {
      a: number;
      b: Date;
    };
    Entity({ key: 'x' })(type);
    Field({ valueType: Number })(type.prototype, 'a');
    Field({ valueType: Date })(type.prototype, 'b');

    let c = new Remult().repo(type);
    let z = new RestDataProvider("", {
      delete: undefined,
      get: async () => {
        return [
          {
            a: 1,
            b: "2021-05-16T08:32:19.905Z"
          }
        ]
      },
      post: undefined,
      put: undefined
    });
    let x = z.getEntityDataProvider(c.metadata);
    let r = await x.find();
    expect(r.length).toBe(1);
    expect(r[0].a).toBe(1);
    expect(r[0].b.valueOf()).toBe(new Date("2021-05-16T08:32:19.905Z").valueOf());
    expect(r[0].b instanceof Date).toBe(true);
  })
  it("put works", async () => {
    let type = class extends EntityBase {
      a: number;
      b: Date;
    };
    Entity({ key: 'x' })(type);
    Field({ valueType: Number })(type.prototype, 'a');
    Field({ valueType: Date })(type.prototype, 'b');

    let c = new Remult().repo(type);
    let r = await entityFilterToJson(c.metadata, x => x.b.isEqualTo(new Date("2021-05-16T08:32:19.905Z")));
    expect(r.b).toBe("2021-05-16T08:32:19.905Z");
  })
  it("put works", async () => {
    let type = class extends EntityBase {
      a: number;
      b: Date;
    };
    Entity({ key: 'x' })(type);
    Field({ valueType: Number })(type.prototype, 'a');
    Field({ valueType: Date })(type.prototype, 'b');

    let c = new Remult().repo(type);
    let done = new Done();
    let z = new RestDataProvider("", {
      delete: undefined,
      get: undefined,
      post: async (x, data) => {
        done.ok();
        expect(data.a).toBe(1);
        expect(data.b).toBe("2021-05-16T08:32:19.905Z");
        return data;
      },
      put: undefined
    });
    let x = z.getEntityDataProvider(c.metadata);
    let r = await x.insert({
      a: 1,
      b: new Date("2021-05-16T08:32:19.905Z")
    });
    expect(r.a).toBe(1);
    expect(r.b instanceof Date).toBe(true);
    expect(r.b.toISOString()).toBe("2021-05-16T08:32:19.905Z");
    done.test();
  })
});
describe("check allowedDataType", () => {
  let c = new Remult();
  c.setDataProvider(new InMemoryDataProvider());
  let strA = 'roleA',
    strB = 'roleB',
    strC = 'roleC';
  let roleA = (strA);
  let roleB = (strB);
  let roleC = (strC);
  beforeAll(async (done) => {

    await c.setUser({ id: 'x', name: 'y', roles: [strA, strB] }
    );
    done();
  });
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
    let c = new Remult();
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
@Entity<CompoundIdEntity>(
  {
    key: 'compountIdEntity',
    id: x => new CompoundIdField(x.a, x.b)
  })
class CompoundIdEntity extends EntityBase {
  @Field()
  a: number;
  @Field()
  b: number;
  @Field()
  c: number;
}
@Entity<entityWithValidations>({
  key: '',
  allowApiCrud: true,
  saving: async (t) => {
    if (!t.name || t.name.length < 3)
      t._.fields.name.error = 'invalid';

    if (t._.isNew() && (!t.myId || t.myId == 0)) {
      let e = await t.remult.repo(entityWithValidations).find({
        orderBy: x => x.myId.descending(),
        limit: 1
      });

      t.myId = e.length ? e[0].myId + 1 : 1;

    }
    entityWithValidations.savingRowCount++;

  }
})
export class entityWithValidations extends EntityBase {
  @Field()
  myId: number;
  @Field()
  name: string;
  static savingRowCount = 0;
  constructor(private remult: Remult) {
    super();
  }
}
@Entity({ key: '', allowApiUpdate: true })
export class entityWithValidationsOnColumn extends EntityBase {
  @Field()
  myId: number;
  @Field<entityWithValidations, string>({
    validate: (t, c) => {
      if (!t.name || t.name.length < 3)
        c.error = 'invalid on column';
    }
  })
  name: string;

}
@Entity<entityWithValidationsOnEntityEvent>({
  key: '',
  validation: (t => {
    if (!t.name || t.name.length < 3)
      t._.fields.name.error = 'invalid';
  })
})
export class entityWithValidationsOnEntityEvent extends EntityBase {
  @Field()
  myId: number;
  @Field()
  name: string;
}
@Entity<EntityWithLateBoundDbName>({
  key: 'stam',
  sqlExpression: async (t) => '(select ' + await t.id.getDbName() + ')'
})
export class EntityWithLateBoundDbName extends EntityBase {
  @Field({ dbName: 'CategoryID' })
  id: number;

}

async function create4RowsInDp(ctx: Remult, dataProvider: DataProvider) {
  ctx = new Remult();
  ctx.setDataProvider(dataProvider);
  let s = ctx.repo(entityWithValidations);
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
