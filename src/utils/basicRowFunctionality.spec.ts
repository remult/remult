
import { __EntityValueProvider, NumberColumn, StringColumn, Entity, CompoundIdColumn, FilterConsumnerBridgeToUrlBuilder, UrlBuilder, DateTimeDateStorage, DataList } from './utils';
import { createData } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from './server/DataApi';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from './inMemoryDatabase';
import { itAsync } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';


import { environment } from './../environments/environment';




class TestDataApiResponse implements DataApiResponse {
  success(data: any): void {
    fail('didnt expect success: ' + JSON.stringify(data));
  }
  notFound(): void {
    fail('not found');
  }
  error(data: DataApiError) {
    fail('error: ' + data + " " + JSON.stringify(data));
  }
}

class Done {
  happened = false;
  ok() {
    this.happened = true;
  }
  test() {
    if (!this.happened)
      fail('expected to be done');
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
  it("can be saved to a pojo", () => {
    let x = new Categories();
    x.id.value = 1;
    x.categoryName.value = 'noam';
    let y = x.__toPojo();
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });
  it("json name is important", () => {
    let x = new Categories();
    x.id.value = 1;
    x.categoryName.jsonName = 'xx';
    x.categoryName.value = 'noam';
    let y = x.__toPojo();
    expect(y.id).toBe(1);
    expect(y.xx).toBe('noam');
  });
  it("json name is important 1", () => {
    let x = new myTestEntity();
    x.id.value = 1;
    expect(x.name1.jsonName).toBe('name');
    x.name1.value = 'noam';
    let y = x.__toPojo();
    expect(y.id).toBe(1);
    expect(y.name).toBe('noam', JSON.stringify(y));
    y.name = 'yael';
    x.__fromPojo(y);
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
class myTestEntity extends Entity<number>{
  id = new NumberColumn();
  name1 = new StringColumn({ jsonName: 'name' });
  constructor() {
    super(() => new myTestEntity(), environment.dataSource, 'myTestEntity');
    this.initColumns();
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
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.put(t, 2, {});
    d.test();
  });
  itAsync("put with validations fails", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c, {
      onSavingRow: c => c.categoryName.error = 'invalid'
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
  itAsync("put with validations on entity fails", async () => {

    let c = new entityWithValidations();
    c.setSource(new InMemoryDataProvider());
    await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
    let api = new DataApi(c);
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
  itAsync("entity with different id column still works well", async () => {

    let c = new entityWithValidations();
    c.setSource(new InMemoryDataProvider());
    c = await c.source.Insert(c => { c.myId.value = 1; c.name.value = 'noam'; });
    c.name.value = 'yael';
    await c.save();
    expect(c.name.value).toBe('yael');
    expect((await c.source.find()).length).toBe(1);


  });

  itAsync("put updates", async () => {
    let c = await createData(async insert => insert(1, 'noam'));
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
    var x = await c.source.find({ where: c.id.isEqualTo(1) });
    expect(x[0].categoryName.value).toBe('noam 1');
  });
  itAsync("delete fails when not found", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.delete(t, 2);
    d.test();
  });
  itAsync("delete works ", async () => {

    let c = await createData(async insert => insert(1, 'noam'));
    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = () => d.ok();
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
    var api = new DataApi(c);
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
    t.success = async (data: any) => {
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
    t.success = async (data: any) => {
      expect(data.id).toBe(2);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.post(t, { categoryName: 'noam' });
    d.test();
  });
  itAsync("post with logic works and max", async () => {


    let c = await createData(async (i) => { i(1, 'a'); });

    var api = new DataApi(c, {
      onSavingRow: async c => {
        if (c.isNew)
          c.id.value = (await c.source.max(c.id)) + 1;
      }
    });
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(2);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.post(t, { categoryName: 'noam' });
    d.test();
  });
  itAsync("post with logic works and max in entity", async () => {

    let c = new entityWithValidations();

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.name).toBe('noam honig');
      expect(data.myId).toBe(1);
      d.ok();
    };
    await api.post(t, { name: 'noam honig' });
    d.test();
    
  });
  itAsync("post with validation fails", async () => {


    let c = await createData(async () => { });

    var api = new DataApi(c, { onSavingRow: c => c.categoryName.error = 'invalid' });
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

    var api = new DataApi(c, { onSavingRow: async c => { c.description.value.length + 1 } });
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
      }
    });
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
      }
    });
    d.test();
  });

  it("columnsAreOk", () => {
    let c = new Categories();
    expect(c.__iterateColumns().length).toBe(3);

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
  itAsync("start", async () => {
    let c = new CompoundIdEntity();
    let mem = new InMemoryDataProvider();
    mem.rows[c.__getName()] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];
    c.setSource(mem);

    var r = await c.source.find();
    expect(r.length).toBe(2);
    expect(r[0].a.value).toBe(1);
    expect(r[0].id.value).toBe('1,11');
    r = await c.source.find({ where: c.id.isEqualTo('1,11') });

    expect(r.length).toBe(1);
    expect(r[0].a.value).toBe(1);
  });
  it("test id filter", () => {
    let c = new CompoundIdEntity();
    let u = new UrlBuilder("");
    c.id.isEqualTo('1,11').__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(u));
    expect(u.url).toBe('?a=1&b=11');
  });
  itAsync("update", async () => {
    let c = new CompoundIdEntity();
    let mem = new InMemoryDataProvider();
    mem.rows[c.__getName()] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];
    c.setSource(mem);

    var r = await c.source.find();
    r[0].c.value = 55;
    let saved = await r[0].save();


    expect(mem.rows[c.__getName()][0].c).toBe(55);
    expect(mem.rows[c.__getName()][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,11');
  });
  itAsync("update2", async () => {
    let c = new CompoundIdEntity();
    let mem = new InMemoryDataProvider();
    mem.rows[c.__getName()] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];
    c.setSource(mem);

    var r = await c.source.find();
    r[0].b.value = 55;
    let saved = await r[0].save();


    expect(mem.rows[c.__getName()][0].b).toBe(55);
    expect(mem.rows[c.__getName()][0].id).toBe(undefined);
    expect(r[0].id.value).toBe('1,55');
  });
  itAsync("insert", async () => {
    let c = new CompoundIdEntity();
    let mem = new InMemoryDataProvider();
    mem.rows[c.__getName()] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];
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
    let c = new CompoundIdEntity();
    let mem = new InMemoryDataProvider();
    mem.rows[c.__getName()] = [{ a: 1, b: 11, c: 111 }, { a: 2, b: 22, c: 222 }];
    c.setSource(mem);
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
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(16);

  });

});
class CompoundIdEntity extends Entity<string>
{
  a = new NumberColumn();
  b = new NumberColumn();
  c = new NumberColumn();
  id = new CompoundIdColumn(this, this.a, this.b);
  constructor() {
    super(() => new CompoundIdEntity(), environment.dataSource, "compountIdEntity");
    this.initColumns();
  }
}
export class entityWithValidations extends Entity<number>{
  myId = new NumberColumn();
  name = new StringColumn();
  constructor() {
    super(() => new entityWithValidations(), new InMemoryDataProvider());
    this.initColumns();
    this.onSavingRow = async () => {
      if (!this.name.value || this.name.value.length < 3)
        this.name.error = 'invalid';
        
      if (this.isNew() && (!this.myId.value || this.myId.value == 0)){
        
        this.myId.value = await this.source.max(this.myId) + 1;
        
      }
    };

  }
}