import { Entity, Field, FieldType, Fields, InMemoryDataProvider, Remult, ValueListItem, getEntityRef, getFields } from "../../../core";
import { Categories, Categories as newCategories, CategoriesForTesting } from '../../../core/src/tests/remult-3-entities';
import { createData } from '../../../core/src/tests/createData'
import { DataAreaSettings, DataControl, DataControlSettings, FieldCollection, GridSettings, decorateDataSettings, getEntityValueList } from "../../interfaces";
import { insertFourRows, myDp } from "../../../core/src/tests/RowProvider.spec";
import { Lookup } from "../lookup";
import { FilterHelper } from "../../interfaces/src/filter-helper";
import { Done } from "../../../core/src/tests/Done";


describe("grid settings ",
  () => {
    let ctx = new Remult();
    ctx.dataProvider = (new InMemoryDataProvider());

    it("sort is displayed right", () => {
      let s = ctx.repo(newCategories);


      let gs = new GridSettings(s);
      expect(gs.sortedAscending(s.metadata.fields.id)).toBe(false);
      expect(gs.sortedDescending(s.metadata.fields.id)).toBe(false);
      gs.sort(s.metadata.fields.id);
      expect(gs.sortedAscending(s.metadata.fields.id)).toBe(true);
      expect(gs.sortedDescending(s.metadata.fields.id)).toBe(false);
      gs.sort(s.metadata.fields.id);
      expect(gs.sortedAscending(s.metadata.fields.id)).toBe(false);
      expect(gs.sortedDescending(s.metadata.fields.id)).toBe(true);
    });
    it("sort is displayed right on start", () => {
      let s = ctx.repo(newCategories);

      //@ts-ignore
      let gs = new GridSettings(s, { orderBy: { Categories: "asc" } });
      expect(gs.sortedAscending(s.metadata.fields.id)).toBe(false);
      expect(gs.sortedDescending(s.metadata.fields.id)).toBe(false);
      gs.sort(s.metadata.fields.id);
      expect(gs.sortedAscending(s.metadata.fields.id)).toBe(true);
      expect(gs.sortedDescending(s.metadata.fields.id)).toBe(false);
      expect(gs.sortedAscending(s.metadata.fields.categoryName)).toBe(false);
      expect(gs.sortedDescending(s.metadata.fields.categoryName)).toBe(false);
    });
    it("paging works", async () => {
      let [c] = await createData(async i => {
        await i(1, "a");
        await i(2, "b");
        await i(3, "a");
        await i(4, "b");
        await i(5, "a");
        await i(6, "b");
        await i(7, "a");
        await i(8, "b");
      });

      let ds = new GridSettings<CategoriesForTesting>(c, { rowsInPage: 2 });
      await ds.reloadData();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(1);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(3);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(5);
      await ds.previousPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(3);
    });
    it("paging works with filter", async () => {
      let [c] = await createData(async i => {
        await i(1, "a");
        await i(2, "b");
        await i(3, "a");
        await i(4, "b");
        await i(5, "a");
        await i(6, "b");
        await i(7, "a");
        await i(8, "b");
      });

      let ds = new GridSettings<CategoriesForTesting>(c, { rowsInPage: 2, where: () => ({ categoryName: 'b' }) });
      await ds.reloadData();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(2);
      await ds.nextPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(6);
      await ds.nextPage();
      expect(ds.items.length).toBe(0);

      await ds.previousPage();
      expect(ds.items.length).toBe(2);
      expect(ds.items[0].id).toBe(6);
    });
    it("test filter works", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings(c, {

        orderBy: { id: "asc" },
        where: () => ({ categoryName: { $contains: 'a' } }),
        rowsInPage: 2

      });
      await ds.reloadData();
      expect(ds.items.length).toBe(2);
      expect(await c.count((await (await ds.getFilterWithSelectedRows())).where)).toBe(3);


    });
    it("test filter works without the get statement", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings(c, {

        orderBy: { id: "asc" },
        where: () => ({ categoryName: { $contains: 'a' } }),
        rowsInPage: 2

      });
      await ds.reloadData();
      expect(ds.items.length).toBe(2);
      expect(await c.count((await ds.getFilterWithSelectedRows()).where)).toBe(3);


    });

    it("test filter works with user filter", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings<CategoriesForTesting>(c, {
        orderBy: { id: "asc" },
        where: () => ({ categoryName: { $contains: 'a' } }),
        rowsInPage: 2
      });
      await ds.reloadData();
      ds.filterHelper.filterRow.description = 'y';
      ds.filterHelper.filterColumn(ds.filterHelper.filterRow._.fields.description, false, false);
      let w = (await ds.getFilterWithSelectedRows()).where;

      expect(await c.count(w)).toBe(1);

    });
    it("test filter works with selected rows", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings<CategoriesForTesting>(c, {
        orderBy: { id: "asc" },
        rowsInPage: 3
      });
      await ds.reloadData();
      ds.selectedChanged(ds.items[0]);
      ds.selectedChanged(ds.items[2]);
      expect(ds.selectedRows[0].id).toBe(1);
      expect(ds.selectedRows[1].id).toBe(3);
      let w = (await ds.getFilterWithSelectedRows()).where;

      expect(await c.count(w)).toBe(2);
      expect(await c.count({ id: [1, 3] })).toBe(2);
    });
    it("test all rows selected when some rows are outside the scope", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings(c, {
        orderBy: { id: "asc" },
        rowsInPage: 3
      });
      await ds.reloadData();
      ds.selectAllChanged({
        checked: true
      });
      expect(ds.selectAllChecked()).toBe(true);
      expect(ds.selectedRows.length).toBe(3);
      let w = (await ds.getFilterWithSelectedRows()).where;
      expect(await c.count(w)).toBe(4);
    });
    it("test select rows in page is not select all", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings(c, {
        orderBy: { id: "asc" },
        rowsInPage: 3
      });
      await ds.reloadData();
      expect(ds.selectAllIntermitent()).toBe(false, 'intermetent');
      for (const r of ds.items) {
        ds.selectedChanged(r);
      }
      expect(ds.selectAllIntermitent()).toBe(true, 'intermetent');
      expect(ds.selectAllChecked()).toBe(false, 'select all checked');
      expect(ds.selectedRows.length).toBe(3, 'selected rows');
      let w = (await (await ds.getFilterWithSelectedRows())).where;

      expect(await c.count(w)).toBe(3, 'rows in count');
    });
    it("select select row by row when all rows are in view", async () => {
      let [c] = await insertFourRows();
      let ds = new GridSettings(c, {
        knowTotalRows: true,
        orderBy: { id: "asc" },
        rowsInPage: 4
      });
      await ds.reloadData();
      expect(ds.selectAllIntermitent()).toBe(false);
      for (const r of ds.items) {
        ds.selectedChanged(r);
      }
      expect(ds.selectAllIntermitent()).toBe(false);
      expect(ds.selectAllChecked()).toBe(true);
      expect(ds.selectedRows.length).toBe(4);
      let w = (await (await ds.getFilterWithSelectedRows())).where;
      expect(await c.count(w)).toBe(4);
    });
  });
it("test grid update", async () => {
  let [c] = await insertFourRows();
  let ds = new GridSettings<CategoriesForTesting>(c, {
    orderBy: { id: "asc" }
  });
  await ds.reloadData();
  expect(ds.items.length).toBe(4);
  expect(ds.items[0].categoryName).toBe('noam');
  ds.items[0].categoryName = 'noam honig';
  await ds.items[0]._.save();
  expect(ds.items[0].categoryName).toBe('noam honig');
});

it("test grid update and validation cycle", async () => {
  var remult = new Remult();
  remult.dataProvider = (new InMemoryDataProvider());
  let type = class extends newCategories {
    categoryName: string

  }
  let orderOfOperation = '';
  Entity('asdf', {
    saving: () => orderOfOperation += "EntityOnSavingRow,",
    validation: r => orderOfOperation += "EntityValidate,",

  })(type);
  Fields.string({
    validate: () => { orderOfOperation += "ColumnValidate," }
  })(type.prototype, "categoryName")
  var c = remult.repo(type);
  var newC = c.create();
  newC.categoryName = 'noam';
  newC.id = 1;
  await newC._.save();;


  let ds = new GridSettings<CategoriesForTesting>(c, {
    saving: r => orderOfOperation += "GridOnSavingRow,",
    validation: r => orderOfOperation += "GridValidate,",
    orderBy: { id: "asc" }
  });

  await ds.reloadData();

  let r = ds.items[0];


  expect(r.categoryName).toBe('noam');
  r.categoryName = 'noam honig';
  orderOfOperation = '';
  await ds._doSavingRow(r);
  expect(ds.items[0].categoryName).toBe('noam honig');
  expect(orderOfOperation).toBe("ColumnValidate,EntityValidate,GridValidate,GridOnSavingRow,EntityOnSavingRow,");
});
it("lookup with undefined doesn't fetch", async () => {

  let cont = new Remult();
  cont.dataProvider = ({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
  let c = cont.repo(newCategories);

  let calledFind = false;
  var l = new Lookup({
    ...c,
    metadata: c.metadata,
    create: () => c.create(),
    find: options => {
      calledFind = true;
      return c.find(options)
    }
  });
  var nc = { value: undefined };
  nc.value = undefined;
  expect(nc.value).toBe(undefined);
  await l.getAsync({ id: nc.value });
  expect(calledFind).toBe(false, 'expected not to call find');
  nc.value = 1;
  await l.getAsync({ id: nc.value });
  expect(calledFind).toBe(true);

});
it("lookup return the same new row", async () => {
  let cont = new Remult();
  cont.dataProvider = ({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
  let c = cont.repo(newCategories);
  var nc = { value: undefined };
  nc.value = 1;
  let lookup = new Lookup<newCategories>(c);
  let r = lookup.get({ id: nc.value });
  expect(getEntityRef(r).isNew()).toBe(true);
  r.id = 5;
  expect(lookup.get({ id: nc.value }).id).toBe(5);
  r = await lookup.getAsync({ id: nc.value });
  expect(r.id).toBe(5);

});
it("lookup updates the data", async () => {
  let [c] = await createData(async insert => await insert(1, 'noam'));
  let lookup = new Lookup<CategoriesForTesting>(c);
  let r = lookup.get({ id: 1 });
  expect(r._.isNew()).toBe(true);
  expect(r.id).toBe(1);
  r = await c.findFirst({ id: 1 }, { createIfNotFound: true });
  expect(r._.isNew()).toBe(false);
  await r._.delete();
  expect(await c.count()).toBe(0);
  r = await c.findFirst({ id: 1 }, { createIfNotFound: true });
  expect(r._.isNew()).toBe(true);
  expect(r.id).toBe(1);
  await r._.save();
  expect(await c.count()).toBe(1);


});
it("column drop down", async () => {
  let [c] = await createData(async insert => {
    await insert(1, 'noam');
    await insert(2, 'yael');
  });

  let cc = new FieldCollection(() => c.create(), () => true, undefined, () => true, undefined);
  let cs = { valueList: getEntityValueList(c) } as DataControlSettings<Categories>
  await cc.buildDropDown(cs);
  let xx = cs.valueList as ValueListItem[];
  expect(xx.length).toBe(2);
  expect(xx[0].id).toBe(1);
  expect(xx[1].id).toBe(2);
  expect(xx[0].caption).toBe('noam');
  expect(xx[1].caption).toBe('yael');

});

it("column drop down with promise", async () => {
  let [c] = await createData(async insert => {
    await insert(1, 'noam');
    await insert(2, 'yael');
  });

  let cc = new FieldCollection(() => c.create(), () => true, undefined, () => true, undefined);
  let cs = { valueList: getEntityValueList(c) } as DataControlSettings<Categories>
  await cc.buildDropDown(cs);
  let xx = cs.valueList as ValueListItem[];
  expect(xx.length).toBe(2);
  expect(xx[0].id).toBe(1);
  expect(xx[1].id).toBe(2);
  expect(xx[0].caption).toBe('noam');
  expect(xx[1].caption).toBe('yael');

});

it("column drop down with promise", async () => {
  let [c] = await createData(async insert => {
    await insert(1, 'noam');
    await insert(2, 'yael');
  });

  let cc = new FieldCollection(() => c.create(), () => true, undefined, () => true, undefined);
  let cs = { valueList: getEntityValueList(c) } as DataControlSettings<Categories>
  await cc.buildDropDown(cs);
  let xx = cs.valueList as ValueListItem[];
  expect(xx.length).toBe(2);
  expect(xx[0].id).toBe(1);
  expect(xx[1].id).toBe(2);
  expect(xx[0].caption).toBe('noam');
  expect(xx[1].caption).toBe('yael');

});
it("column drop down with items", async () => {
  let c = new Categories();

  let cc = new FieldCollection(() => c, () => true, undefined, () => true, undefined);
  let cs = { valueList: [{ id: 1, caption: 'a' }, { id: 0, caption: 'b' }] } as DataControlSettings<Categories>
  await cc.buildDropDown(cs);
  let xx = cs.valueList as ValueListItem[];
  expect(xx.length).toBe(2);
  expect(xx[0].id).toBe(1);
  expect(xx[1].id).toBe(0);
  expect(xx[0].caption).toBe('a');
  expect(xx[1].caption).toBe('b');

});

it("column drop down 1, values are string for number value type, because it goes to inputValue", async () => {
  let [c] = await createData(async insert => {
    await insert(1, 'noam');
    await insert(2, 'yael');
  });
  let c1 = c.create();
  let cc = new FieldCollection(() => c.create(), () => true, undefined, () => true, () => undefined);
  let cs = { field: c1._.fields.id.metadata, valueList: getEntityValueList(c) } as DataControlSettings<newCategories>
  await cc.add(cs);

  let xx = cs.valueList as ValueListItem[];
  expect(xx.length).toBe(2);
  expect(xx[0].id).toBe('1');
  expect(xx[1].id).toBe('2');
  expect(xx[0].caption).toBe('noam');
  expect(xx[1].caption).toBe('yael');
  var c2 = c.create();
  c2.id = 1;
  expect(cc._getColDisplayValue(cc.items[0], c2)).toBe('noam');

});
class myClass1 {
  @Fields.integer()
  @DataControl<myClass1>({
    getValue: self => self.a * 3
  })
  a: number;
}
describe("field display stuff", () => {
  it("get value function works", () => {
    let x = new myClass1();
    let $ = getFields(x);
    x.a = 5;
    var cc = new FieldCollection(undefined, () => true, undefined, () => true, undefined);
    cc.add($.a);
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe(15);
  });
})
class myClass2 {
  @Fields.dateOnly()
  @DataControl<myClass2>({
    readonly: true
  })
  a: Date;
}
describe("field display stuff", () => {
  it("readonly should work well", () => {
    let x = new myClass2();
    let $ = getFields(x);

    var cc = new FieldCollection(undefined, () => true, undefined, () => true, undefined);
    cc.add($.a);
    expect(cc.items[0].readonly).toBe(true);
    expect(cc.items[0].inputType).toBe('date');

  });
})
class myClass3 {
  @Fields.integer({
    caption: '1st', ...{ caption: '2nd' }
  })
  @DataControl<myClass3>({
    inputType: 'text'
  })

  a: Number;
}
describe("field display stuff", () => {
  it("test consolidate", () => {

    let x = new myClass3();
    let $ = getFields(x);
    let s: DataControlSettings = { readonly: true };
    decorateDataSettings($.a.metadata, s);
    expect(s.inputType).toBe('text');
    expect(s.readonly).toBe(true);


  });
})
class myClass4 {
  @Fields.string()
  @DataControl<myClass4>({
    readonly: true
  })

  a: string;
}
describe("field display stuff", () => {
  it("readonly should work well for string column", () => {
    let x = new myClass4();
    let $ = getFields(x);

    var cc = new FieldCollection(undefined, () => true, undefined, () => true, undefined);
    cc.add($.a);
    expect(cc.items[0].readonly).toBe(true);
    expect(cc.items[0].inputType).toBe(undefined);

  });

});
describe("api test", () => {
  it("can build", () => {
    let ctx = new Remult();
    ctx.dataProvider = (new InMemoryDataProvider());

    let gs = new GridSettings(ctx.repo(newCategories));
    gs.addArea({
      fields: x => [
        x.categoryName,
        [x.categoryName, x.categoryName]]
    });



  });


});
describe("column collection", () => {
  let ctx = new Remult();
  ctx.dataProvider = (new InMemoryDataProvider());

  it("uses a saparate column", async () => {
    let type = class extends newCategories {
      categoryName: string;
    }
    Entity('asdf')(type);
    Fields.string({
      allowApiUpdate: false
    })(type.prototype, "categoryName");
    let c = ctx.repo(type);


    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    await cc.add(c.metadata.fields.categoryName);
    expect(cc.items[0] === c.metadata.fields.categoryName).toBe(false);
    expect(cc.items[0] === cc.items[0].field).toBe(false);
    expect(cc.items[0].caption == c.metadata.fields.categoryName.caption).toBe(true);
    expect(cc.items[0].readonly).toBe(true);

  })

  it("works ok with filter", async () => {
    let c = ctx.repo(newCategories);
    var cc = new FieldCollection(() => c, () => false, new FilterHelper(() => { }, c), () => true, () => undefined);
    await cc.add(c.metadata.fields.id);
    cc.filterHelper.filterColumn(cc.items[0].field, false, false);
    expect(cc.filterHelper.isFiltered(cc.items[0].field)).toBe(true);

  });
  it("test caption etc...", async () => {
    let c = ctx.repo(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add(c.metadata.fields.id);
    expect(cc.items[0].caption).toBe('Id');

  })
  it("test caption etc...", async () => {
    let c = ctx.repo(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add({ field: c.metadata.fields.id });
    expect(cc.items[0].caption).toBe('Id');

  })
  it("test caption etc...", async () => {
    let c = ctx.repo(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add({ field: c.metadata.fields.id, width: '100' });
    expect(cc.items[0].caption).toBe('Id');

  })
});

class myClass {
  @Fields.number()
  @DataControl<myClass>({
    valueChange: self => self.d.ok()
  })
  col: Number;
  d = new Done();
}
describe("test column value change", () => {
  it("should fire", () => {

    let x = new myClass();
    let $ = getFields(x);
    let area = new DataAreaSettings({ fields: () => [$.col] });
    area.fields._colValueChanged(area.fields.items[0], null);
    x.d.test();
  });
});
// describe("test number column", () => {
//   it("Number is always a number", () => {
//     let x = new NumberColumn();
//     var z: any = '123';
//     x.value = z;
//     x.value += 1;
//     expect(x.value).toBe(124);
//   });
// });

@FieldType()
@DataControl({ click: () => { }, allowClick: () => true })
class typefd {

}

class myClassfd {
  @Fields.string()
  @DataControl({ click: () => { } })
  a: string;
  @Field(() => typefd)
  b: typefd;
}

describe("data control overrides settings on column", () => {
  it("testit", () => {
    let $ = getFields(new myClassfd());
    let defs: DataControlSettings = { field: $.a, click: null };
    decorateDataSettings(defs.field, defs);
    expect(defs.click).toBeNull();
  });
  it("testit2", () => {
    let $ = getFields(new myClassfd());
    let defs: DataControlSettings = { field: $.b, click: null };
    decorateDataSettings(defs.field, defs);
    expect(defs.click).toBeNull();
  });
});
describe("test grid basics", () => {
  it("basically works", async () => {
    let [c] = await insertFourRows();
    let gs = new GridSettings(c);
    await gs.reloadData();
    expect(gs.columns.items.length).toBe(6);
    expect(gs.columns._getColDisplayValue(gs.columns.items[0], gs.items[0])).toBe("1");
  });
});
