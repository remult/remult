import { FieldMetadata, FieldOptions, ValueConverter, ValueListItem } from '../column-interfaces';
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { testAllDataProviders } from './testHelper.spec';
import { Status, TestStatus } from './testModel/models';
import { Remult } from '../context';
import { OneToMany } from '../column';
import { FilterHelper } from '../../../angular/src/filter-helper';

import { FilterConsumerBridgeToSqlRequest } from '../filter/filter-consumer-bridge-to-sql-request';
import { Validators } from '../validators';
import { FieldCollection, DataAreaSettings, DataControlSettings, getValueList, GridSettings, InputField, DataControl, decorateDataSettings, DataControlInfo } from '../../../angular';
import { Lookup } from '../../../angular/src/lookup';
import { IdEntity } from '../id-entity';
import { Categories, Categories as newCategories, CategoriesForTesting } from './remult-3-entities';
import { Entity as EntityDecorator, Field as ColumnDecorator, getEntityRef, decorateColumnSettings, Entity, Field, FieldType, ValueListFieldType, getFields, DateOnlyField } from '../remult3/RepositoryImplementation';
import { Sort, SqlDatabase, WebSqlDataProvider } from '../..';
import { EntityBase, EntityMetadata, Repository, FindOptions } from '../remult3';
import { CharDateValueConverter, DateOnlyValueConverter, DefaultValueConverter, ValueListValueConverter } from '../../valueConverters';
import { EntityOptions } from '../entity';

import { entityFilterToJson, Filter } from '../filter/filter-interfaces';
import { ClassType } from '../../classType';
import { Done } from './Done';
import { createData } from './createData';








export class Language {
  static Hebrew = new Language(0, 'עברית');
  static Russian = new Language(10, 'רוסית');
  static Amharit = new Language(20, 'אמהרית');
  constructor(public id: number,
    public caption: string) {

  }

}

export async function insertFourRows() {

  return createData(async i => {
    await i(1, 'noam', 'x');
    await i(4, 'yael', 'x');
    await i(2, 'yoni', 'y');
    await i(3, 'maayan', 'y');
  });
};

describe("grid filter stuff", () => {
  it("test filter works", async () => {
    let [c] = await insertFourRows();
    let ds = new GridSettings(c, {

      orderBy: { id: "asc" },
      where: { categoryName: { $contains: 'a' } },
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
      where: { categoryName: { $contains: 'a' } },
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
      where: { categoryName: { $contains: 'a' } },
      rowsInPage: 2
    });
    await ds.reloadData();
    ds.filterHelper.filterRow.description = 'y';
    ds.filterHelper.filterColumn(ds.filterHelper.filterRow._.fields.description, false, false);
    let w = (await ds.getFilterWithSelectedRows()).where;

    expect(await c.count(w)).toBe(1);

  });
  it("filter with contains", async () => {
    let x = new FilterConsumerBridgeToSqlRequest({
      addParameterAndReturnSqlToken: () => "",
      execute: () => { throw "rr" }
    }, {
      entityName: '',
      nameOf: () => 'col',
      isDbReadonly: () => false
    });

    x.containsCaseInsensitive(new mockColumnDefs("col"), "no'am");
    expect(await x.resolveWhere()).toBe(" where lower (col) like lower ('%no''am%')");
  });
  it("filter with contains", async () => {
    let x = new FilterConsumerBridgeToSqlRequest({
      addParameterAndReturnSqlToken: () => "",
      execute: () => { throw "rr" }
    }, {
      entityName: '',
      nameOf: () => 'col',
      isDbReadonly: () => false
    });

    x.containsCaseInsensitive(new mockColumnDefs("col"), "no'a'm");
    expect(await x.resolveWhere()).toBe(" where lower (col) like lower ('%no''a''m%')");
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
  it("test in statement", async () => {
    let [c] = await insertFourRows();
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
  it("test context change event", async () => {
    let d = new Done();
    let c = new Remult();
    let r = await c.userChange.observe(() => d.ok());
    d.test("first fire");
    d = new Done();
    c.setUser({
      id: '',
      name: '',
      roles: []
    });
    d.test("changed on user changed");
    d = new Done();
    r();
    c.setUser({
      id: '1',
      name: '1',
      roles: []
    });
    expect(d.happened).toBe(false, "should not have fired because unsubscribe has happened");

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

describe("Closed List  column", () => {

  it("Basic Operations", () => {
    let x = new ValueListValueConverter(Language);


    expect(x.fromJson(0)).toBe(Language.Hebrew);
    expect(x.toJson(Language.Russian)).toBe(10);

    expect(new ValueListValueConverter(Language).getOptions().length).toBe(3);
  });

  it("test auto caption", () => {
    let val = new ValueListValueConverter(valueList);
    expect(valueList.firstName.caption).toBe('First Name');
  });
  it("test with entity", async () => {
    let c = new Remult()
      .repo(entityWithValueList, new InMemoryDataProvider());
    let e = c.create();
    e.id = 1;
    expect(e.l).toBe(Language.Hebrew);
    e.l = Language.Russian;
    await e._.save();
    e = await c.findFirst();
    expect(e.l).toBe(Language.Russian);
    expect(e._.toApiJson().l).toBe(10);
  })
  it("test with entity and data defined on type", async () => {
    let c = new Remult()
      .repo(entityWithValueList, new InMemoryDataProvider());
    let e = c.create();
    e.id = 1;
    expect(c.metadata.fields.v.valueType).toBe(valueList);
    expect(c.metadata.fields.v.valueConverter.fromJson('listName'))
      .toBe(valueList.listName);
    expect(c.metadata.fields.id.valueType).toBe(Number);
    expect(e.v).toBe(valueList.firstName);

    e.v = valueList.listName;
    await e._.save();
    e = await c.findFirst();
    expect(e.v).toBe(valueList.listName);
    expect(e._.toApiJson().v).toBe('listName');
  })
});


@ValueListFieldType()
class valueList {
  static firstName = new valueList();
  static listName = new valueList();
  constructor(public id?: string, public caption?: string) { }
}

@Entity('entity with value list')
class entityWithValueList extends EntityBase {
  @Field()
  id: number = 0;
  @Field({ valueConverter: new ValueListValueConverter(Language) })
  l: Language = Language.Hebrew;
  @Field()
  v: valueList = valueList.firstName;

}




describe("test row provider", () => {
  it("auto name", () => {
    var cat = new Remult().repo(newCategories).create();
    expect(cat._.repository.metadata.key).toBe('Categories');
  });



  it("test update", async () => {
    let [c] = await createData(async insert => await insert(5, 'noam'));
    let r = await c.find();
    expect(r[0].categoryName).toBe('noam');
    r[0].categoryName = 'yael';
    await r[0]._.save();
    r = await c.find();
    expect(r[0].categoryName).toBe('yael');
  });

  it("test filter", async () => {
    let [c] = await insertFourRows();

    let rows = await c.find();
    expect(rows.length).toBe(4);
    rows = await c.find({ where: { description: 'x' } });
    expect(rows.length).toBe(2);
    rows = await c.find({ where: { id: 4 } });
    expect(rows.length).toBe(1);
    expect(rows[0].categoryName).toBe('yael');
    rows = await c.find({ where: { description: 'y', categoryName: 'yoni' } });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
    rows = await c.find({
      where: { description: 'y', categoryName: 'yoni' }
    });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
    rows = await c.find({
      where: { description: 'y', categoryName: 'yoni' }
    });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
  });

  it("test in filter packer", async () => {
    let [r] = await insertFourRows();
    let rows = await r.find();
    expect(rows.length).toBe(4);

    rows = await r.find({
      where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { description: 'x' }))

    });
    rows = await r.find({ where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { id: [1, 3] })) });
    expect(rows.length).toBe(2);
    rows = await r.find({ where: Filter.entityFilterFromJson(r.metadata, entityFilterToJson(r.metadata, { id: { $ne: [1, 2, 3] } })) });
    expect(rows.length).toBe(1);

  });
  it("sort", async () => {
    let [c] = await insertFourRows();
    let rows = await c.find({ orderBy: { id: "asc" } });
    expect(rows[0].id).toBe(1);
    expect(rows[1].id).toBe(2);
    expect(rows[2].id).toBe(3);
    expect(rows[3].id).toBe(4);

    rows = await c.find({
      orderBy: { categoryName: "desc" }
    });
    expect(rows[0].id).toBe(2);
    expect(rows[1].id).toBe(4);
    expect(rows[2].id).toBe(1);
    expect(rows[3].id).toBe(3);
  });
  it("counts", async () => {
    let [c] = await insertFourRows();
    let count = await c.count();
    expect(count).toBe(4);
  });
  it("counts with filter", async () => {
    let [c] = await insertFourRows();
    let count = await c.count({ id: { "<=": 2 } });
    expect(count).toBe(2);
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

  it("Test Validation 2", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string;
    };
    EntityDecorator('')(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: (entity, col) =>
        Validators.required(entity, col, "m")
    })(type.prototype, "a");
    var c = remult.repo(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {

      expect(cat._.fields.a.error).toEqual("m");
      expect(cat._.error).toBe("A: m");
    }
    expect(saved).toBe(false);

  });
  it("Test Validation 2_1", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string;
    };
    EntityDecorator('')(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: (entity, col) => {
        if (!entity.a || entity.a.length == 0)
          col.error = "m";
      }
    })(type.prototype, "a");
    var c = remult.repo(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.fields.a.error).toEqual("m");
    }
    expect(saved).toBe(false);

  });
  it("Test Validation 3", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string
    };
    EntityDecorator('')(type);
    ColumnDecorator({
      validate: Validators.required.withMessage("m")
    })(type.prototype, "a");
    var c = remult.repo(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.fields.a.error).toEqual("m");
      expect(err.message).toBe("A: m");
    }
    expect(saved).toBe(false);
  });

  it("Test unique Validation and is not empty", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string
    };
    EntityDecorator('asdfa')(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: [Validators.required, Validators.unique]
    })(type.prototype, "a");
    var c = remult.repo(type);
    var cat = c.create();
    var saved = false;
    cat.a = '';
    try {
      await cat._.save();
      saved = true;
    }
    catch {
      expect(cat._.fields.a.error).toEqual("Should not be empty");
      cat.a = '12';
      await cat._.save();
    }
    expect(saved).toBe(false);
    cat = c.create();
    cat.a = '12';


    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.fields.a.error).toEqual("already exists");
    }
    expect(saved).toBe(false);

  });

  it("test grid update and validation cycle", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      categoryName: string

    }
    let orderOfOperation = '';
    EntityDecorator('asdf', {
      saving: () => orderOfOperation += "EntityOnSavingRow,",
      validation: r => orderOfOperation += "EntityValidate,",

    })(type);
    ColumnDecorator({
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
  it("test that it fails nicely", async () => {
    let c = (await insertFourRows())[0].create();
    c.id = 1;
    c.categoryName = 'bla bla';
    try {
      await c._.save();
      fail("Shouldnt have reached this");
    }
    catch (err) {

    }
    expect(c.categoryName).toBe('bla bla');
  });
  it("update should fail nicely", async () => {
    let cont = new Remult();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.repo(newCategories).create();
    c.id = 1;
    c.categoryName = 'noam';
    await cont.repo(newCategories).save(c);
    c.categoryName = 'yael';
    try {
      await cont.repo(newCategories).save(c);
      fail("shouldnt be here");
    } catch (err) {
      expect(c.categoryName).toBe('yael');
    }
  });
  it("filter should return none", async () => {

    let [c] = await insertFourRows();
    let r = await c.findFirst({ categoryName: [] }, { createIfNotFound: true });
    expect(r.categoryName).toBe(undefined);
    expect(r.isNew()).toBe(true);

  });
  it("filter ignore works return none", async () => {

    let [c] = await insertFourRows();
    let r = await c.findFirst({ categoryName: undefined }, { createIfNotFound: true });
    expect(r.categoryName).toBe("noam");
    expect(r.isNew()).toBe(false);

  });
  it("lookup with undefined doesn't fetch", async () => {

    let cont = new Remult();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
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
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
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
  it("lookup survives row that doesn't exist", async () => {
    let [c] = await createData(async insert => await insert(1, 'noam'));
    let r = await c.findId(5);
    expect(r).toBeUndefined();
    r = await c.findId(5);
    expect(r).toBeUndefined();



  });

  it("column drop down", async () => {
    let [c] = await createData(async insert => {
      await insert(1, 'noam');
      await insert(2, 'yael');
    });

    let cc = new FieldCollection(() => c.create(), () => true, undefined, () => true, undefined);
    let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
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
    let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
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
    let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
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
    let cs = { field: c1._.fields.id.metadata, valueList: getValueList(c) } as DataControlSettings<newCategories>
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
  it("get value function works 1", () => {
    let a = new InputField<number>({ valueType: Number });
    a.value = 5;
    var cc = new DataAreaSettings({ fields: () => [a] })


    expect(cc.fields._getColDisplayValue(cc.fields.items[0], null)).toBe('5');

  });
  it("get value function works 2", () => {
    let a = new InputField<number>({ valueType: Number });
    a.value = 5;
    var cc = new FieldCollection(undefined, () => true, undefined, () => true, undefined);
    cc.add(a);
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe('5');

  });
  it("get value function works 3", () => {
    let a = new InputField<number>({ valueType: Number });
    a.value = 5;
    var cc = new FieldCollection(undefined, () => true, undefined, () => true, undefined);
    cc.add({ field: a, getValue: () => a.value * 2 });
    expect(cc._getColDisplayValue(cc.items[0], null)).toBe(10);
  });
})
class myClass1 {
  @Field()
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
  @DateOnlyField()
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
  @Field({
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
  @Field()
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
    ctx.setDataProvider(new InMemoryDataProvider());

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
  ctx.setDataProvider(new InMemoryDataProvider());

  it("uses a saparate column", async () => {
    let type = class extends newCategories {
      categoryName: string;
    }
    EntityDecorator('asdf')(type);
    ColumnDecorator({
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
describe("grid settings ",
  () => {
    let ctx = new Remult();
    ctx.setDataProvider(new InMemoryDataProvider());

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

      let ds = new GridSettings<CategoriesForTesting>(c, { rowsInPage: 2, where: { categoryName: 'b' } });
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
  });

@Entity('typeA', { dbName: 'dbnameA' })
class typeA extends EntityBase {

}
@Entity('typeB')
class typeB extends typeA {

}
describe("decorator inheritance", () => {
  it("entity extends", async () => {

    let c = new Remult();
    let defsA = c.repo(typeA).metadata;
    expect(defsA.key).toBe('typeA');
    expect((await defsA.getDbName())).toBe('dbnameA');
    let defsB = c.repo(typeB).metadata;
    expect(defsB.key).toBe("typeB");
    expect((await defsB.getDbName())).toBe("dbnameA");;

  });

});
describe("order by api", () => {
  it("works with sort", () => {
    let c = new Remult().repo(Categories);
    let opt: FindOptions<Categories> = { orderBy: { id: "asc" } };
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].field.key).toBe(c.metadata.fields.id.key);


  });


  it("works with columns array", () => {
    let c = new Remult().repo(Categories);
    let opt: FindOptions<Categories> = {
      orderBy: {
        id: "asc",
        categoryName: "asc"
      }
    };
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].field).toBe(c.metadata.fields.id);
    expect(s.Segments[1].field).toBe(c.metadata.fields.categoryName);
  });


  it("test several sort options", async () => {
    let [c] = await createData(async i => {
      await i(1, 'z');
      await i(2, 'y');
    });

    let r = await c.find({ orderBy: { categoryName: "asc" } });
    expect(r.length).toBe(2);
    expect(r[0].id).toBe(2);

    r = await c.find({ orderBy: { categoryName: "asc" } });
    expect(r.length).toBe(2);
    expect(r[0].id).toBe(2);

    r = await c.find({ orderBy: { categoryName: "desc" } });
    expect(r.length).toBe(2);
    expect(r[0].id).toBe(1);

  });
});
describe("test area", () => {
  it("works without entity", () => {
    let n = new InputField<number>({
      valueType: Number
    });
    n.value = 5;
    let area = new DataAreaSettings({ fields: () => [n] });
    expect(area.fields.items.length).toBe(1);
    expect(area.fields.__showArea()).toBe(true);
    expect(area.fields.getNonGridColumns().length).toBe(1);
  });
});

class myClass {
  @Field()
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
  it("should fire", () => {
    let d = new Done();
    let x = new InputField<number>({
      valueChange: () => d.ok()
    });
    let area = new DataAreaSettings({ fields: () => [x] });
    area.fields._colValueChanged(area.fields.items[0], null);
    d.test();
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

describe("test datetime column", () => {
  it("stores well", () => {
    let col = decorateColumnSettings<Date>({ valueType: Date }, new Remult());
    let val = col.valueConverter.fromJson(col.valueConverter.toJson(new Date(1976, 11, 16, 8, 55, 31, 65)));
    expect(val.toISOString()).toBe(new Date(1976, 11, 16, 8, 55, 31, 65).toISOString());
  });
  it("stores well undefined", () => {
    let col = decorateColumnSettings<Date>({ valueType: Date }, new Remult());
    expect(col.valueConverter.toJson(undefined)).toBe('');
  });
  it("displays empty date well", () => {

    expect(DateOnlyValueConverter.displayValue(DateOnlyValueConverter.fromJson(''))).toBe('');
  });
  it("displays null date well 1", () => {

    expect(DateOnlyValueConverter.toJson(null)).toBe(null);
    expect(DateOnlyValueConverter.toJson(null)).toBe(null);
    expect(DateOnlyValueConverter.displayValue(null)).toBe('');
  });
  it("displays empty date well empty", () => {
    expect(DateOnlyValueConverter.displayValue(DateOnlyValueConverter.fromJson('0000-00-00'))).toBe('');
  });
  it("Date only stuff", () => {
    function test(d: Date, expected: string) {
      expect(DateOnlyValueConverter.toJson(d)).toBe(expected);
      const ed = DateOnlyValueConverter.fromJson(expected);
      expect(ed.getFullYear()).toEqual(d.getFullYear(), "year");
      expect(ed.getMonth()).toEqual(d.getMonth(), "month");
      expect(ed.getDate()).toEqual(d.getDate(), "day");

    }
    test(new Date(2021, 2, 26), '2021-03-26');
    test(new Date(2021, 9, 31), '2021-10-31');
    //test(new Date('1976-06-16'), '1976-06-16');
    //test(new Date('1976-6-16'), '1976-06-16');
    test(new Date(1976, 5, 16), '1976-06-16');
    test(new Date(2021, 9, 30), '2021-10-30');
    test(new Date(2021, 2, 26), '2021-03-26');
    "".toString();
  });


  it("date Storage works 1", () => {

    let col = decorateColumnSettings<Date>({
      valueType: Date,
      valueConverter: DateOnlyValueConverter
    }, new Remult());
    expect(col.valueConverter.toDb(col.valueConverter.fromJson('1976-06-16')).toLocaleDateString()).toBe(new Date(1976, 5, 16, 0, 0, 0).toLocaleDateString());
    expect(col.valueConverter.toDb(col.valueConverter.fromJson('1976-06-16')).getDate()).toBe(16);


  });

});
@FieldType()
@DataControl({ click: () => { }, allowClick: () => true })
class typefd {

}
class myClassfd {
  @Field()
  @DataControl({ click: () => { } })
  a: string;
  @Field()
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
describe("Test char date storage", () => {


  let x = CharDateValueConverter;
  it("from db", () => {
    expect(x.toJson(x.fromDb('19760616'))).toBe('1976-06-16');
  });
  it("to db", () => {
    expect(x.toDb(x.fromJson('1976-06-16'))).toBe('19760616');
  });
});

describe("value list column without id and caption", () => {
  it("works with automatic id", () => {
    let col = new InputField<TestStatus>({
      valueConverter: new ValueListValueConverter(TestStatus),
      defaultValue: () => TestStatus.open
    });

    col.value = TestStatus.open;
    expect(col.value).toBe(TestStatus.open);
    expect(col.inputValue).toBe('open');
    col.value = TestStatus.closed;
    expect(col.inputValue).toBe('cc');
    let options = new ValueListValueConverter(TestStatus).getOptions();
    expect(options.length).toBe(3);
    expect(options[2].caption).toBe('hh');
    expect(options[2].id).toBe('hold');

  })
})
describe("relation", () => {
  it("should get values", async () => {

    let [c] = await insertFourRows();
    let r = new OneToMany(c, {
      where: { description: "x" }
    });
    let rows = await r.load();
    expect(rows.length).toBe(2);
    let n = await r.create();
    expect(n.description).toBe("x");
  });
  it("should have an array and lazy load it", async () => {
    let [c] = await insertFourRows();
    let r = new OneToMany(c, {
      where: { description: 'x' }
    });
    let arr = r.lazyItems;
    expect(arr.length).toBe(0);
    await r.load();
    expect(arr.length).toBe(2);

  });
});
describe("context", () => {
  it("what", () => {
    var c = new Remult();
    expect(c.authenticated()).toBe(false);
    expect(c.user.id).toBe(undefined);
    expect(c.user.name).toBe("");
    expect(c.user.roles.length).toBe(0);
    c.setUser({
      id: '1',
      name: 'name',
      roles: ["a"]
    });
    expect(c.authenticated()).toBe(true);
    c.setUser(undefined);
    expect(c.authenticated()).toBe(false);
    expect(c.user.id).toBe(undefined);
    expect(c.user.name).toBe("");
    expect(c.user.roles.length).toBe(0);

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

@EntityDecorator<TestCategories1>('123')
class TestCategories1 extends newCategories {
  @ColumnDecorator({
    validate: Validators.required
  })
  a: string;
}
describe("test ", () => {
  it("Test Validation,", async () => {
    var remult = new Remult();
    remult.setDataProvider(new InMemoryDataProvider());

    var c = remult.repo(TestCategories1);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await c.save(cat);
      saved = true;
    }
    catch (err) {
      expect(getEntityRef(cat).fields.a.error).toEqual("Should not be empty");
    }
    expect(saved).toBe(false);

  });
});

class myDp extends ArrayEntityDataProvider {
  constructor(entity: EntityMetadata) {
    super(entity, []);
  }
  public update(id: any, data: any): Promise<any> {
    throw new Error("what");
  }
}






class mockColumnDefs implements FieldMetadata {
  constructor(public dbName: string) {

  }
  async getDbName(): Promise<string> {
    return this.dbName;
  }
  options: FieldOptions<any, any>;
  valueConverter: ValueConverter<any> = DefaultValueConverter;
  target: ClassType<any>;
  readonly: boolean;
  readonly dbReadOnly: boolean;
  readonly isServerExpression: boolean;
  readonly key: string;
  readonly caption: string;
  readonly inputType: string;


  readonly valueType: any;
  readonly allowNull: boolean;
  readonly dbType: string;
}


