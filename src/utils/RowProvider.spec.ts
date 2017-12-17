import { FindOptionsPerEntity } from './DataInterfaces';
import { NumberColumn, extractSortFromSettings } from '../';

import { Entity, Column, Sort, ColumnCollection, FilterHelper } from './utils';
import { GridSettings, Lookup, ColumnSetting } from './utils';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from './inMemoryDatabase'
import { itAsync } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';
import { error } from 'util';




export async function createData(doInsert: (insert: (id: number, name: string, description?: string) => Promise<void>) => Promise<void>) {

  let c = new Categories();
  c.setSource(new InMemoryDataProvider());
  await doInsert(async (id, name, description) => {
    await c.source.Insert(c => {
      c.id.value = id;
      c.categoryName.value = name;
      c.description.value = description;
    });
  });
  return c;
}

async function insertFourRows() {

  return createData(async i => {
    await i(1, 'noam', 'x');
    await i(4, 'yael', 'x');
    await i(2, 'yoni', 'y');
    await i(3, 'maayan', 'y');
  });
};

describe("test row provider", () => {
  itAsync("Insert", async () => {


    var cat = new Categories();

    cat.setSource(new InMemoryDataProvider());

    let rows = await cat.source.find();
    expect(rows.length).toBe(0);
    await cat.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam';
    });
    rows = await cat.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("Insert another way", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    let rows = await x.source.find();
    expect(rows.length).toBe(0);
    var c = new Categories();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    c.source = x.source;
    await c.save();
    rows = await x.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("one more insert", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    var c = x.source.createNewItem();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    c.save();
    var r = await x.source.find();
    expect(r[0].categoryName.value).toBe('noam');
  });
  itAsync("Yet Another Test", async () => {
    let x = new Categories();
    x.setSource(new InMemoryDataProvider());
    let rows = await x.source.find();
    expect(rows.length).toBe(0);
    await x.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam';
    });
    rows = await x.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });
  itAsync("test  delete", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    c.id.value = 5;
    c.categoryName.value = 'noam';
    c.save();
    let rows = await c.source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(5);
    await c.delete();
    rows = await c.source.find();
    expect(rows.length).toBe(0);

  });
  itAsync("test update", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    c.id.value = 5;
    c.categoryName.value = 'noam';
    c.save();
    let r = await c.source.find();
    expect(r[0].categoryName.value).toBe('noam');
    c.categoryName.value = 'yael';
    c.save();
    r = await c.source.find();
    expect(r[0].categoryName.value).toBe('yael');
  });

  itAsync("test filter", async () => {
    let c = await insertFourRows();

    let rows = await c.source.find();
    expect(rows.length).toBe(4);
    rows = await c.source.find({ where: c.description.isEqualTo('x') });
    expect(rows.length).toBe(2);
    rows = await c.source.find({ where: c.id.isEqualTo(4) });
    expect(rows.length).toBe(1);
    expect(rows[0].categoryName.value).toBe('yael');
    rows = await c.source.find({ where: c.description.isEqualTo('y').and(c.categoryName.isEqualTo('yoni')) });
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(2);
  });
  itAsync("sort", async () => {
    let c = await insertFourRows();
    let rows = await c.source.find({ orderBy: new Sort({ column: c.id }) });
    expect(rows[0].id.value).toBe(1);
    expect(rows[1].id.value).toBe(2);
    expect(rows[2].id.value).toBe(3);
    expect(rows[3].id.value).toBe(4);

    rows = await c.source.find({ orderBy: new Sort({ column: c.categoryName, descending: true }) });
    expect(rows[0].id.value).toBe(2);
    expect(rows[1].id.value).toBe(4);
    expect(rows[2].id.value).toBe(1);
    expect(rows[3].id.value).toBe(3);
  });
  itAsync("test grid update", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {
      get: {
        orderBy: c => new Sort({ column: c.id })
      }
    });
    await ds.getRecords();
    expect(ds.items.length).toBe(4);
    expect(ds.items[0].categoryName.value).toBe('noam');
    ds.items[0].categoryName.value = 'noam honig';
    await ds.items[0].save();
    expect(ds.items[0].categoryName.value).toBe('noam honig');
  });
  itAsync("test that it fails nicely", async () => {
    let c = await insertFourRows();
    c.id.value = 1;
    c.categoryName.value = 'bla bla';
    try {
      c.save();
      fail("Shouldnt have reached this");
    }
    catch (err) {

    }
    expect(c.categoryName.value).toBe('bla bla');
  });
  itAsync("update should fail nicely", async () => {
    let c = new Categories();
    c.setSource({ provideFor: () => new myDp<Categories>() });
    c.id.value = 1;
    c.categoryName.value = 'noam';
    await c.save();
    c.categoryName.value = 'yael';
    try {
      await c.save();
      fail("shouldnt be here");
    } catch (err) {
      expect(c.categoryName.value).toBe('yael');
    }
  });
  itAsync("filter should return none", async () => {

    let c = await insertFourRows();
    let n = c.source.createNewItem();
    let lookup = new Lookup(c);
    let r = await lookup.whenGet(c.categoryName.isEqualTo(undefined));
    expect(r.categoryName.value).toBe(undefined);

  });
  itAsync("column drop down", async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    await c.source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam'
    });
    await c.source.Insert(c => {
      c.id.value = 2;
      c.categoryName.value = 'yael';
    });
    let cc = new ColumnCollection(() => c, () => true, undefined);
    let cs = { dropDown: { source: c } } as ColumnSetting<Categories>
    await cc.buildDropDown(cs);
    expect(cs.dropDown.items.length).toBe(2);
    expect(cs.dropDown.items[0].id).toBe(1);
    expect(cs.dropDown.items[1].id).toBe(2);
    expect(cs.dropDown.items[0].caption).toBe('noam');
    expect(cs.dropDown.items[1].caption).toBe('yael');

  });

});
describe("column collection", () => {
  it("uses a saparate column", () => {
    let c = new Categories();
    var cc = new ColumnCollection(() => c, () => false, undefined);
    cc.add(c.categoryName);
    expect(cc.items[0] === c.categoryName).toBe(false);
    expect(cc.items[0] === cc.items[0].column).toBe(false);
    expect(cc.items[0].caption == c.categoryName.caption);
    expect(cc.items[0].readonly == c.categoryName.readonly);
    expect(cc.items[0].inputType == c.categoryName.inputType);
  })
  it("jsonSaverIsNice", () => {
    let c = new Categories();
    var cc = new ColumnCollection(() => c, () => false, undefined);
    cc.add(c.categoryName);
    expect(cc.__columnTypeScriptDescription(cc.items[0], "x")).toBe("x.categoryName");
    cc.items[0].caption = 'name';
    expect(cc.__columnTypeScriptDescription(cc.items[0], "x")).toBe(`{
    column: x.categoryName, 
    caption: 'name'
  }`);
  })
  it("works ok with filter", () => {
    let c = new Categories();
    var cc = new ColumnCollection(() => c, () => false, new FilterHelper(() => { }));
    cc.add(c.id);
    cc.filterHelper.filterColumn(cc.items[0].column, false);
    expect(cc.filterHelper.isFiltered(cc.items[0].column)).toBe(true);

  });
});
describe("grid settings ",
  () => {
    it("sort is displayed right", () => {
      let c = new Categories();
      let gs = new GridSettings(c);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(true);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(true);
    });
    it("sort is displayed right on start", () => {
      let c = new Categories();
      let gs = new GridSettings(c, { get: { orderBy: c => new Sort({ column: c.categoryName }) } });
      expect(gs.sortedAscending(c.categoryName)).toBe(true);
      expect(gs.sortedDescending(c.categoryName)).toBe(false);
      expect(gs.sortedAscending(c.id)).toBe(false);
      expect(gs.sortedDescending(c.id)).toBe(false);
      gs.sort(c.id);
      expect(gs.sortedAscending(c.id)).toBe(true);
      expect(gs.sortedDescending(c.id)).toBe(false);
      expect(gs.sortedAscending(c.categoryName)).toBe(false);
      expect(gs.sortedDescending(c.categoryName)).toBe(false);
    });
  });
describe("order by api", () => {
  it("works with sort", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => new Sort({ column: c.id }) };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].column).toBe(c.id);


  });
  it("works with columns", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c =>  c.id  };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].column).toBe(c.id);
  });
  
  it("works with columns array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [ c.id,c.categoryName]  };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });
  it("works with segment array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [{ column: c.id }, { column: c.categoryName }]  };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });
  it("works with mixed column segment array", () => {
    let c = new Categories();
    let opt: FindOptionsPerEntity<Categories> = { orderBy: c => [  c.id , { column: c.categoryName }]  };
    let s = extractSortFromSettings(c, opt);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].column).toBe(c.id);
    expect(s.Segments[1].column).toBe(c.categoryName);
  });

});


class myDp<T extends Entity<any>> extends ActualInMemoryDataProvider<T> {
  constructor() {
    super([]);
  }
  public update(id: any, data: any): Promise<any> {
    throw new Error("what");
  }
}


