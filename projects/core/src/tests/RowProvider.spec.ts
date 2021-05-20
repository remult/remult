import { ColumnDefinitions, ColumnSettings, dbLoader, inputLoader, jsonLoader, ValueListItem } from '../column-interfaces';
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Status, TestStatus } from './testModel/models';
import { Allowed, Context, ServerContext } from '../context';
import { OneToMany, ValueList, ValueListInfo } from '../column';
import { FilterHelper } from '../filter/filter-helper';

import { FilterConsumerBridgeToSqlRequest } from '../filter/filter-consumer-bridge-to-sql-request';
import { Validators } from '../validators';
import { ColumnCollection, DataControlSettings, extend, getValueList, GridSettings, InputControl, __getDataControlSettings } from '../../../angular';
import { Lookup } from '../lookup';
import { IdEntity } from '../id-entity';
import { Categories as newCategories, CategoriesForTesting } from './remult-3-entities';
import { Entity as EntityDecorator, Column as ColumnDecorator, getEntityOf, decorateColumnSettings, Entity, Column, StorableClass } from '../remult3/RepositoryImplementation';
import { SqlDatabase, WebSqlDataProvider } from '../..';
import { EntityBase, EntityDefinitions, ClassType, Repository } from '../remult3';
import { CharDateLoader, DateDisplayValue, DateOnlyJsonLoader, DateOnlyDateDbLoader, DateTimeJsonLoader } from '../columns/loaders';







export class Language {
  static Hebrew = new Language(0, 'עברית');
  static Russian = new Language(10, 'רוסית');
  static Amharit = new Language(20, 'אמהרית');
  constructor(public id: number,
    public caption: string) {

  }

}




export async function testAllDbs<T extends CategoriesForTesting>(doTest: (helper: {
  context: Context,
  createData: (doInsert?: (insert: (id: number, name: string, description?: string, status?: Status) => Promise<void>) => Promise<void>,
    entity?: {
      new(): CategoriesForTesting
    }) => Promise<Repository<T>>,
  insertFourRows: () => Promise<Repository<T>>
}) => Promise<any>) {
  let webSql = new WebSqlDataProvider('test');
  var sql = new SqlDatabase(webSql);

  for (const r of await (await sql.execute("select name from sqlite_master where type='table'")).rows) {
    switch (r.name) {
      case "__WebKitDatabaseInfoTable__":
        break;
      default:
        await sql.execute("drop table if exists " + r.name);
    }
  }

  for (const db of [
    new InMemoryDataProvider()
    ,
    sql
  ]) {
    if (!db)
      throw new Error("you forget to set a db for the test");
    let context = new ServerContext(db);

    let createData = async (doInsert, entity?) => {
      if (!entity)
        entity = newCategories;
      let rep = context.for(entity) as Repository<T>;
      if (doInsert)
        await doInsert(async (id, name, description, status) => {

          let c = rep.create();

          c.id = id;
          c.categoryName = name;
          c.description = description;
          if (status)
            c.status = status;
          await rep.save(c);

        });
      return rep;
    };

    await doTest({
      context,
      createData,
      insertFourRows: async () => {
        return createData(async i => {
          await i(1, 'noam', 'x');
          await i(4, 'yael', 'x');
          await i(2, 'yoni', 'y');
          await i(3, 'maayan', 'y');
        });
      }
    });
  }

}
export async function createData(doInsert?: (insert: (id: number, name: string, description?: string, status?: Status) => Promise<void>) => Promise<void>, entity?: {
  new(): CategoriesForTesting
}) {
  let context = new ServerContext();
  context.setDataProvider(new InMemoryDataProvider());
  if (!entity)
    entity = newCategories;
  let rep = context.for(entity);
  if (doInsert)
    await doInsert(async (id, name, description, status) => {

      let c = rep.create();
      c.id = id;
      c.categoryName = name;
      c.description = description;
      if (status)
        c.status = status;
      await rep.save(c);

    });
  return rep;
}

async function insertFourRows() {

  return createData(async i => {
    await i(1, 'noam', 'x');
    await i(4, 'yael', 'x');
    await i(2, 'yoni', 'y');
    await i(3, 'maayan', 'y');
  });
};

describe("grid filter stuff", () => {
  itAsync("test filter works", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {

      orderBy: c => c.id,
      where: c =>
        c.categoryName.contains('a'),
      rowsInPage: 2

    });
    await ds.reloadData();
    expect(ds.items.length).toBe(2);
    expect(await c.count(ds.getFilterWithSelectedRows().where)).toBe(3);


  });
  itAsync("test filter works without the get statement", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {

      orderBy: c => c.id,
      where: c => c.categoryName.contains('a'),
      rowsInPage: 2

    });
    await ds.reloadData();
    expect(ds.items.length).toBe(2);
    expect(await c.count(ds.getFilterWithSelectedRows().where)).toBe(3);


  });
  if (false)
    itAsync("test filter works with user filter", async () => {
      let c = await insertFourRows();
      let ds = new GridSettings(c, {
        orderBy: c => c.id,
        where: c => c.categoryName.contains('a'),
        rowsInPage: 2
      });
      await ds.reloadData();
      ds.filterHelper.filterRow.description = 'y';
      ds.filterHelper.filterColumn(ds.filterHelper.filterRow._.columns.description, false, false);
      let w = ds.getFilterWithSelectedRows().where;

      expect(await c.count(w)).toBe(1);

    });
  it("filter with contains", () => {
    let x = new FilterConsumerBridgeToSqlRequest({
      addParameterAndReturnSqlToken: () => "",
      execute: () => { throw "rr" }
    });

    x.containsCaseInsensitive(new mockColumnDefs("col"), "no'am");
    expect(x.where).toBe(" where lower (col) like lower ('%no''am%')");
  });
  it("filter with contains", () => {
    let x = new FilterConsumerBridgeToSqlRequest({
      addParameterAndReturnSqlToken: () => "",
      execute: () => { throw "rr" }
    });

    x.containsCaseInsensitive(new mockColumnDefs("col"), "no'a'm");
    expect(x.where).toBe(" where lower (col) like lower ('%no''a''m%')");
  });
  it("filter with start with", () => {
    let x = new FilterConsumerBridgeToSqlRequest({
      addParameterAndReturnSqlToken: () => "?",
      execute: () => { throw "rr" }
    });
    x.startsWith(new mockColumnDefs("col"), "no'am");
    expect(x.where).toBe(" where col like ?");
  });
  if (false)
    itAsync("test filter works with selected rows", async () => {
      let c = await insertFourRows();
      let ds = new GridSettings(c, {
        orderBy: c => c.id,
        rowsInPage: 3
      });
      await ds.reloadData();
      ds.selectedChanged(ds.items[0]);
      ds.selectedChanged(ds.items[2]);
      expect(ds.selectedRows[0].id).toBe(1);
      expect(ds.selectedRows[1].id).toBe(3);
      let w = ds.getFilterWithSelectedRows().where;

      expect(await c.count(w)).toBe(2);
      expect(await c.count(c => c.id.isIn([1, 3]))).toBe(2);
    });
  itAsync("test in statement", async () => {
    let c = await insertFourRows();
    expect(await c.count(c => c.id.isIn([1, 3]))).toBe(2);
  });
  itAsync("test all rows selected when some rows are outside the scope", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {
      orderBy: c => c.id,
      rowsInPage: 3
    });
    await ds.reloadData();
    ds.selectAllChanged({
      checked: true
    });
    expect(ds.selectAllChecked()).toBe(true);
    expect(ds.selectedRows.length).toBe(3);
    let w = ds.getFilterWithSelectedRows().where;
    expect(await c.count(w)).toBe(4);
  });
  it("test context change event", () => {
    let d = new Done();
    let c = new Context();
    let r = c.userChange.observe(() => d.ok());
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
  if (false)
    itAsync("test select rows in page is not select all", async () => {
      let c = await insertFourRows();
      let ds = new GridSettings(c, {
        orderBy: c => c.id,
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
      let w = ds.getFilterWithSelectedRows().where;

      expect(await c.count(w)).toBe(3, 'rows in count');
    });
  itAsync("select select row by row when all rows are in view", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {
      knowTotalRows: true,
      orderBy: c => c.id,
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
    let w = ds.getFilterWithSelectedRows().where;
    expect(await c.count(w)).toBe(4);
  });
});

describe("Closed List  column", () => {

  it("Basic Operations", () => {
    let x = ValueList(Language);


    expect(x.jsonLoader.fromJson(0)).toBe(Language.Hebrew);
    expect(x.jsonLoader.toJson(Language.Russian)).toBe(10);

    expect(ValueListInfo.get(Language).getOptions().length).toBe(3);
  });

  it("test auto caption", () => {
    let val = ValueListInfo.get(valueList);
    expect(valueList.firstName.caption).toBe('First Name');
  });
  itAsync("test with entity", async () => {
    let c = new ServerContext(new InMemoryDataProvider())
      .for(entityWithValueList);
    let e = c.create();
    e.id = 1;
    expect(e.l).toBe(Language.Hebrew);
    e.l = Language.Russian;
    await e._.save();
    e = await c.findFirst();
    expect(e.l).toBe(Language.Russian);
    expect(e._.toApiPojo().l).toBe(10);
  })
  itAsync("test with entity and data defined on type", async () => {
    let c = new ServerContext(new InMemoryDataProvider())
      .for(entityWithValueList);
    let e = c.create();
    e.id = 1;
    expect(c.defs.columns.v.dataType).toBe(valueList);
    expect(c.defs.columns.v.jsonLoader.fromJson('listName'))
      .toBe(valueList.listName);
    expect(c.defs.columns.id.dataType).toBe(Number);
    expect(e.v).toBe(valueList.firstName);

    e.v = valueList.listName;
    await e._.save();
    e = await c.findFirst();
    expect(e.v).toBe(valueList.listName);
    expect(e._.toApiPojo().v).toBe('listName');
  })
});

export function fColumn<T = any, colType = any>(settings?: ColumnSettings<colType, T>) {
  let c = Column(settings);
  return (target, key) => {
    debugger;
    return c(target, key);
  }

}
@StorableClass(ValueList(valueList))
class valueList {
  static firstName = new valueList();
  static listName = new valueList();
  constructor(public id?: string, public caption?: string) { }
}

@Entity({ key: 'entity with value list' })
class entityWithValueList extends EntityBase {
  @Column()
  id: number = 0;
  @Column(ValueList(Language))
  l: Language = Language.Hebrew;
  @Column()
  v: valueList = valueList.firstName;

}




describe("test row provider", () => {
  it("auto name", () => {
    var cat = new Context().for(newCategories).create();
    expect(cat._.repository.defs.key).toBe('Categories');
  });
  itAsync("Insert", async () => {
    await testAllDbs(async ({ createData }) => {
      let forCat = await createData(async x => { });
      let rows = await forCat.find();
      expect(rows.length).toBe(0);
      let c = forCat.create();
      c.id = 1;
      c.categoryName = 'noam';
      await c._.save();
      rows = await forCat.find();
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(1);
      expect(rows[0].categoryName).toBe('noam');
    })
  });



  itAsync("test delete", async () => {

    await testAllDbs(async ({ createData }) => {
      let c = await createData(async insert => await insert(5, 'noam'));

      let rows = await c.find();
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(5);
      await rows[0]._.delete();
      rows = await c.find();
      expect(rows.length).toBe(0);
    })


  });
  itAsync("test update", async () => {
    let c = await createData(async insert => await insert(5, 'noam'));
    let r = await c.find();
    expect(r[0].categoryName).toBe('noam');
    r[0].categoryName = 'yael';
    await r[0]._.save();
    r = await c.find();
    expect(r[0].categoryName).toBe('yael');
  });

  itAsync("test filter", async () => {
    let c = await insertFourRows();

    let rows = await c.find();
    expect(rows.length).toBe(4);
    rows = await c.find({ where: c => c.description.isEqualTo('x') });
    expect(rows.length).toBe(2);
    rows = await c.find({ where: c => c.id.isEqualTo(4) });
    expect(rows.length).toBe(1);
    expect(rows[0].categoryName).toBe('yael');
    rows = await c.find({ where: c => c.description.isEqualTo('y').and(c.categoryName.isEqualTo('yoni')) });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
    rows = await c.find({
      where: [c => c.description.isEqualTo('y'), c => c.categoryName.isEqualTo('yoni'), undefined]
    });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
    rows = await c.find({
      where: c => [c.description.isEqualTo('y'), c.categoryName.isEqualTo('yoni')]
    });
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(2);
  });
  itAsync("test filter packer", async () => {
    await testAllDbs(async ({ insertFourRows }) => {
      let r = await insertFourRows();
      let rows = await r.find();
      expect(rows.length).toBe(4);

      rows = await r.find({
        where: c => r.unpackWhere(r.packWhere(c => c.description.isEqualTo('x')))

      });
      expect(rows.length).toBe(2);
      rows = await r.find({ where: c => r.unpackWhere(r.packWhere(c => c.id.isEqualTo(4))) });
      expect(rows.length).toBe(1);
      expect(rows[0].categoryName).toBe('yael');
      rows = await r.find({ where: c => r.unpackWhere(r.packWhere(c => c.description.isEqualTo('y').and(c.categoryName.isEqualTo('yoni')))) });
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(2);
      rows = await r.find({ where: c => r.unpackWhere(r.packWhere(c => c.id.isDifferentFrom(4).and(c.id.isDifferentFrom(2)))) });
      expect(rows.length).toBe(2);
    })

  });
  itAsync("test in filter packer", async () => {
    let r = await insertFourRows();
    let rows = await r.find();
    expect(rows.length).toBe(4);

    rows = await r.find({
      where: c => r.unpackWhere(r.packWhere(c => c.description.isEqualTo('x')))

    });
    rows = await r.find({ where: c => r.unpackWhere(r.packWhere(c => c.id.isIn([1, 3]))) });
    expect(rows.length).toBe(2);
    rows = await r.find({ where: c => r.unpackWhere(r.packWhere(c => c.id.isNotIn([1, 2, 3]))) });
    expect(rows.length).toBe(1);

  });
  itAsync("sort", async () => {
    let c = await insertFourRows();
    let rows = await c.find({ orderBy: c => c.id });
    expect(rows[0].id).toBe(1);
    expect(rows[1].id).toBe(2);
    expect(rows[2].id).toBe(3);
    expect(rows[3].id).toBe(4);

    rows = await c.find({
      orderBy: c =>
        c.categoryName.descending()
    });
    expect(rows[0].id).toBe(2);
    expect(rows[1].id).toBe(4);
    expect(rows[2].id).toBe(1);
    expect(rows[3].id).toBe(3);
  });
  itAsync("counts", async () => {
    let c = await insertFourRows();
    let count = await c.count();
    expect(count).toBe(4);
  });
  itAsync("counts with filter", async () => {
    let c = await insertFourRows();
    let count = await c.count(c => c.id.isLessOrEqualTo(2));
    expect(count).toBe(2);
  });
  itAsync("test grid update", async () => {
    let c = await insertFourRows();
    let ds = new GridSettings(c, {
      orderBy: c => c.id
    });
    await ds.reloadData();
    expect(ds.items.length).toBe(4);
    expect(ds.items[0].categoryName).toBe('noam');
    ds.items[0].categoryName = 'noam honig';
    await ds.items[0]._.save();
    expect(ds.items[0].categoryName).toBe('noam honig');
  });

  itAsync("Test Validation 2", async () => {
    var context = new ServerContext(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string;
    };
    EntityDecorator({ key: ''  })(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: (entity, col) =>
        Validators.required(entity, col, "m")
    })(type.prototype, "a");
    var c = context.for(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.columns.a.error).toEqual("m");
    }
    expect(saved).toBe(false);

  });
  itAsync("Test Validation 2_1", async () => {
    var context = new ServerContext(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string;
    };
    EntityDecorator({ key: '' })(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: (entity, col) => {
        if (!entity.a || entity.a.length == 0)
          col.error = "m";
      }
    })(type.prototype, "a");
    var c = context.for(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.columns.a.error).toEqual("m");
    }
    expect(saved).toBe(false);

  });
  itAsync("Test Validation 3", async () => {
    var context = new ServerContext(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string
    };
    EntityDecorator({ key: '' })(type);
    ColumnDecorator({
      validate: Validators.required.withMessage("m")
    })(type.prototype, "a");
    var c = context.for(type);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await cat._.save();
      saved = true;
    }
    catch (err) {
      expect(cat._.columns.a.error).toEqual("m");
    }
    expect(saved).toBe(false);
  });
  itAsync("Test unique Validation,", async () => {
    await testAllDbs(async ({ context }) => {
      let type = class extends newCategories {
        a: string
      };
      EntityDecorator({ key: 'categories' })(type);
      ColumnDecorator<typeof type.prototype, string>({
        validate: async (en, col) => {
          if (en._.isNew() || en.a != en._.columns.a.originalValue) {
            if (await c.count(f => f.a.isEqualTo(en.a)))
              en._.columns.a.error = 'already exists';
          }
        }
      })(type.prototype, "a");
      var c = context.for(type);

      var cat = c.create();
      cat.a = '12';
      cat.id = 1;
      await cat._.save();
      cat = c.create();
      cat.a = '12';

      var saved = false;
      try {
        await cat._.save();
        saved = true;
      }
      catch (err) {
        expect(cat._.columns.a.error).toEqual("already exists");
      }
      expect(saved).toBe(false);
    });

  });
  itAsync("Test unique Validation 2", async () => {
    await testAllDbs(async ({ context }) => {
      let type = class extends newCategories {
        a: string
      };
      EntityDecorator({ key: 'sdfgds' })(type);
      ColumnDecorator<typeof type.prototype, string>({
        validate: Validators.unique
      })(type.prototype, "a");
      var c = context.for(type);
      var cat = c.create();
      cat.a = '12';

      await cat._.save();
      cat = c.create();
      cat.a = '12';

      var saved = false;
      try {
        await cat._.save();
        saved = true;
      }
      catch (err) {
        expect(cat._.columns.a.error).toEqual("already exists");
      }
      expect(saved).toBe(false);
    });

  });
  itAsync("Test unique Validation and is not empty", async () => {
    var context = new ServerContext(new InMemoryDataProvider());
    let type = class extends newCategories {
      a: string
    };
    EntityDecorator({ key: 'asdfa' })(type);
    ColumnDecorator<typeof type.prototype, string>({
      validate: [Validators.required, Validators.unique]
    })(type.prototype, "a");
    var c = context.for(type);
    var cat = c.create();
    var saved = false;
    cat.a = '';
    try {
      await cat._.save();
      saved = true;
    }
    catch {
      expect(cat._.columns.a.error).toEqual("Should not be empty");
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
      expect(cat._.columns.a.error).toEqual("already exists");
    }
    expect(saved).toBe(false);

  });

  itAsync("test grid update and validation cycle", async () => {
    var context = new ServerContext();
    context.setDataProvider(new InMemoryDataProvider());
    let type = class extends newCategories {
      categoryName: string

    }
    let orderOfOperation = '';
    EntityDecorator({
      key: 'asdf',
      saving: () => orderOfOperation += "EntityOnSavingRow,",
      validation: r => orderOfOperation += "EntityValidate,",
      
    })(type);
    ColumnDecorator({
      validate: () => { orderOfOperation += "ColumnValidate," }
    })(type.prototype, "categoryName")
    var c = context.for(type);
    var newC = c.create();
    newC.categoryName = 'noam';
    newC.id = 1;
    await newC._.save();;


    let ds = new GridSettings(c, {
      saving: r => orderOfOperation += "GridOnSavingRow,",
      validation: r => orderOfOperation += "GridValidate,",
      orderBy: c => c.id
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
  itAsync("test that it fails nicely", async () => {
    let c = (await insertFourRows()).create();
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
  itAsync("update should fail nicely", async () => {
    let cont = new ServerContext();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.for(newCategories).create();
    c.id = 1;
    c.categoryName = 'noam';
    await cont.for(newCategories).save(c);
    c.categoryName = 'yael';
    try {
      await cont.for(newCategories).save(c);
      fail("shouldnt be here");
    } catch (err) {
      expect(c.categoryName).toBe('yael');
    }
  });
  itAsync("filter should return none", async () => {

    let c = await insertFourRows();


    let r = await c.lookupAsync(c => c.categoryName.isEqualTo(undefined));
    expect(r.categoryName).toBe(undefined);

  });
  itAsync("lookup with undefined doesn't fetch", async () => {

    let cont = new ServerContext();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.for(newCategories);

    let calledFind = false;
    var l = new Lookup({
      ...c,
      updateEntityBasedOnWhere: (x, y) => c.updateEntityBasedOnWhere(x, y),
      create: () => c.create(),
      packWhere: x => c.packWhere(x),
      find: options => {
        calledFind = true;
        return c.find(options)
      }
    });
    var nc = { value: undefined };
    nc.value = undefined;
    expect(nc.value).toBe(undefined);
    await l.whenGet(c => c.id.isEqualTo(nc.value));
    expect(calledFind).toBe(false, 'expected not to call find');
    nc.value = 1;
    await l.whenGet(c => c.id.isEqualTo(nc.value));
    expect(calledFind).toBe(true);

  });
  itAsync("lookup return the same new row", async () => {
    let cont = new ServerContext();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.for(newCategories);
    var nc = { value: undefined };
    nc.value = 1;
    let r = c.lookup(x => x.id.isEqualTo(nc.value));
    expect(getEntityOf(r).isNew()).toBe(true);
    r.id = 5;
    expect(c.lookup(x => x.id.isEqualTo(nc.value)).id).toBe(5);
    r = await c.lookupAsync(x => x.id.isEqualTo(nc.value));
    expect(r.id).toBe(5);

  });
  itAsync("lookup updates the data", async () => {
    let c = await createData(async insert => await insert(1, 'noam'));
    let r = c.lookup(c => c.id.isEqualTo(1));
    expect(r._.isNew()).toBe(true);
    expect(r.id).toBe(1);
    r = await c.lookupAsync(c => c.id.isEqualTo(1));
    expect(r._.isNew()).toBe(false);
    await r._.delete();
    expect(await c.count()).toBe(0);
    r = await c.lookupAsync(c => c.id.isEqualTo(1));
    expect(r._.isNew()).toBe(true);
    expect(r.id).toBe(1);
    await r._.save();
    expect(await c.count()).toBe(1);


  });
  if (false)
    itAsync("column drop down", async () => {
      // let c = await createData(async insert => {
      //   await insert(1, 'noam');
      //   await insert(2, 'yael');
      // });

      // let cc = new ColumnCollection(() => c.create(), () => true, undefined, () => true);
      // let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
      // await cc.buildDropDown(cs);
      // let xx = cs.valueList as ValueListItem[];
      // expect(xx.length).toBe(2);
      // expect(xx[0].id).toBe(1);
      // expect(xx[1].id).toBe(2);
      // expect(xx[0].caption).toBe('noam');
      // expect(xx[1].caption).toBe('yael');

    });
  if (false)
    itAsync("column drop down with promise", async () => {
      // let c = await createData(async insert => {
      //   await insert(1, 'noam');
      //   await insert(2, 'yael');
      // });

      // let cc = new ColumnCollection(() => c.create(), () => true, undefined, () => true);
      // let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
      // await cc.buildDropDown(cs);
      // let xx = cs.valueList as ValueListItem[];
      // expect(xx.length).toBe(2);
      // expect(xx[0].id).toBe(1);
      // expect(xx[1].id).toBe(2);
      // expect(xx[0].caption).toBe('noam');
      // expect(xx[1].caption).toBe('yael');

    });
  if (false)
    itAsync("column drop down with promise", async () => {
      // let c = await createData(async insert => {
      //   await insert(1, 'noam');
      //   await insert(2, 'yael');
      // });

      // let cc = new ColumnCollection(() => c.create(), () => true, undefined, () => true);
      // let cs = { valueList: getValueList(c) } as DataControlSettings<Categories>
      // await cc.buildDropDown(cs);
      // let xx = cs.valueList as ValueListItem[];
      // expect(xx.length).toBe(2);
      // expect(xx[0].id).toBe(1);
      // expect(xx[1].id).toBe(2);
      // expect(xx[0].caption).toBe('noam');
      // expect(xx[1].caption).toBe('yael');

    });
  itAsync("column drop down with items", async () => {
    // let c = new Categories();

    // let cc = new ColumnCollection(() => c, () => true, undefined, () => true);
    // let cs = { valueList: [{ id: 1, caption: 'a' }, { id: 0, caption: 'b' }] } as DataControlSettings<Categories>
    // await cc.buildDropDown(cs);
    // let xx = cs.valueList as ValueListItem[];
    // expect(xx.length).toBe(2);
    // expect(xx[0].id).toBe(1);
    // expect(xx[1].id).toBe(0);
    // expect(xx[0].caption).toBe('a');
    // expect(xx[1].caption).toBe('b');

  });
  if (false)
    itAsync("column drop down 1", async () => {
      let c = await createData(async insert => {
        await insert(1, 'noam');
        await insert(2, 'yael');
      });
      let c1 = c.create();
      let cc = new ColumnCollection(() => c.create(), () => true, undefined, () => true, () => undefined);
      let cs = { column: c1._.columns.id.defs, valueList: getValueList(c) } as DataControlSettings<newCategories>
      await cc.add(cs);

      let xx = cs.valueList as ValueListItem[];
      expect(xx.length).toBe(2);
      expect(xx[0].id).toBe(1);
      expect(xx[1].id).toBe(2);
      expect(xx[0].caption).toBe('noam');
      expect(xx[1].caption).toBe('yael');
      var c2 = c.create();
      c2.id = 1;
      expect(cc._getColDisplayValue(cc.items[0], c2)).toBe('noam');

    });
  // it("get value function works", () => {
  //   let a = new NumberColumn();
  //   a.value = 5;
  //   var cc = new DataAreaSettings({ columnSettings: () => [a] })


  //   expect(cc.columns._getColDisplayValue(cc.columns.items[0], null)).toBe('5');

  // });
  // it("get value function works", () => {
  //   let a = new NumberColumn();
  //   a.value = 5;
  //   var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
  //   cc.add(a);
  //   expect(cc._getColDisplayValue(cc.items[0], null)).toBe('5');

  // });
  // it("get value function works", () => {
  //   let a = new NumberColumn();
  //   a.value = 5;
  //   var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
  //   cc.add({ column: a, getValue: () => a.value * 2 });
  //   expect(cc._getColDisplayValue(cc.items[0], null)).toBe(10);
  // });
  // it("get value function works", () => {
  //   let a = extend(new NumberColumn()).dataControl(s => s.getValue = () => a.value * 3);
  //   a.value = 5;
  //   var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
  //   cc.add(a);
  //   expect(cc._getColDisplayValue(cc.items[0], null)).toBe(15);
  // });
  // it("readonly should work well", () => {
  //   let a = extend(new DateColumn()).dataControl(s => s.readOnly = true);

  //   var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
  //   cc.add(a);
  //   expect(cc.items[0].readOnly).toBe(true);
  //   expect(cc.items[0].inputType).toBe('date');

  // });
  // it("test consolidate", () => {

  //   var col = extend(extend(new NumberColumn({ caption: '1st', ...{ caption: '2nd' } })).dataControl(
  //     x => {
  //       x.inputType = 'text';
  //     }
  //   )).dataControl(x => x.readOnly = true);

  //   let s = __getDataControlSettings(col);
  //   expect(s.inputType).toBe('text');
  //   expect(s.readOnly).toBe(true);


  // });
  // it("readonly should work well for string column", () => {
  //   let a = extend(new StringColumn()).dataControl(x => x.readOnly = true);

  //   var cc = new ColumnCollection(undefined, () => true, undefined, () => true);
  //   cc.add(a);
  //   expect(cc.items[0].readOnly).toBe(true);
  //   expect(cc.items[0].inputType).toBe(undefined);

  // });

});
describe("api test", () => {
  it("can build", () => {
    let ctx = new Context();
    ctx.setDataProvider(new InMemoryDataProvider());

    let gs = new GridSettings(ctx.for(newCategories));
    gs.addArea({
      columnSettings: x => [
        x.categoryName,
        [x.categoryName, x.categoryName]]
    });



  });


});
"".toString();
describe("column collection", () => {
  let ctx = new Context();
  ctx.setDataProvider(new InMemoryDataProvider());
  if (false)
    itAsync("uses a saparate column", async () => {
      let type = class extends newCategories {
        categoryName: string;
      }
      EntityDecorator({ key: 'asdf' })(type);
      ColumnDecorator({
        allowApiUpdate: false
      })(type.prototype, "categoryName");
      let c = ctx.for(type);


      var cc = new ColumnCollection(() => c, () => false, undefined, () => true, () => undefined);
      await cc.add(c.defs.columns.categoryName);
      expect(cc.items[0] === c.defs.columns.categoryName).toBe(false);
      expect(cc.items[0] === cc.items[0].column).toBe(false);
      expect(cc.items[0].caption == c.defs.columns.categoryName.caption).toBe(true);
      expect(cc.items[0].readOnly).toBe(true);

    })

  if (false)
    itAsync("works ok with filter", async () => {
      let c = ctx.for(newCategories);
      var cc = new ColumnCollection(() => c, () => false, new FilterHelper(() => { }, c), () => true, () => undefined);
      await cc.add(c.defs.columns.id);
      cc.filterHelper.filterColumn(cc.items[0].column, false, false);
      expect(cc.filterHelper.isFiltered(cc.items[0].column)).toBe(true);

    });
});
describe("grid settings ",
  () => {
    let ctx = new Context();
    ctx.setDataProvider(new InMemoryDataProvider());
    if (false)
      it("sort is displayed right", () => {
        let s = ctx.for(newCategories);


        let gs = new GridSettings(s);
        expect(gs.sortedAscending(s.defs.columns.id)).toBe(false);
        expect(gs.sortedDescending(s.defs.columns.id)).toBe(false);
        gs.sort(s.defs.columns.id);
        expect(gs.sortedAscending(s.defs.columns.id)).toBe(true);
        expect(gs.sortedDescending(s.defs.columns.id)).toBe(false);
        gs.sort(s.defs.columns.id);
        expect(gs.sortedAscending(s.defs.columns.id)).toBe(false);
        expect(gs.sortedDescending(s.defs.columns.id)).toBe(true);
      });
    if (false)
      it("sort is displayed right on start", () => {
        let s = ctx.for(newCategories);


        let gs = new GridSettings(s, { orderBy: c => c.categoryName });
        //   expect(gs.sortedAscending(y)).toBe(true);
        //   expect(gs.sortedDescending(y)).toBe(false);
        expect(gs.sortedAscending(s.defs.columns.id)).toBe(false);
        expect(gs.sortedDescending(s.defs.columns.id)).toBe(false);
        gs.sort(s.defs.columns.id);
        expect(gs.sortedAscending(s.defs.columns.id)).toBe(true);
        expect(gs.sortedDescending(s.defs.columns.id)).toBe(false);
        expect(gs.sortedAscending(s.defs.columns.categoryName)).toBe(false);
        expect(gs.sortedDescending(s.defs.columns.categoryName)).toBe(false);
      });
    it("paging works", async () => {
      let c = await createData(async i => {
        await i(1, "a");
        await i(2, "b");
        await i(3, "a");
        await i(4, "b");
        await i(5, "a");
        await i(6, "b");
        await i(7, "a");
        await i(8, "b");
      });

      let ds = new GridSettings(c, { rowsInPage: 2 });
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
      let c = await createData(async i => {
        await i(1, "a");
        await i(2, "b");
        await i(3, "a");
        await i(4, "b");
        await i(5, "a");
        await i(6, "b");
        await i(7, "a");
        await i(8, "b");
      });

      let ds = new GridSettings(c, { rowsInPage: 2, where: c => c.categoryName.isEqualTo('b') });
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

describe("order by api", () => {
  // it("works with sort", () => {
  //   let c = new Categories();
  //   let opt: FindOptions<Categories> = { orderBy: c => new Sort({ column: c.id }) };
  //   let s = entityOrderByToSort(c, opt.orderBy);
  //   expect(s.Segments.length).toBe(1);
  //   expect(s.Segments[0].column).toBe(c.id);


  // });
  // it("works with columns", () => {
  //   let c = new Categories();
  //   let opt: FindOptions<Categories> = { orderBy: c => c.id };
  //   let s = entityOrderByToSort(c, opt.orderBy);
  //   expect(s.Segments.length).toBe(1);
  //   expect(s.Segments[0].column).toBe(c.id);
  // });

  // it("works with columns array", () => {
  //   let c = new Categories();
  //   let opt: FindOptions<Categories> = { orderBy: c => [c.id, c.categoryName] };
  //   let s = entityOrderByToSort(c, opt.orderBy);
  //   expect(s.Segments.length).toBe(2);
  //   expect(s.Segments[0].column).toBe(c.id);
  //   expect(s.Segments[1].column).toBe(c.categoryName);
  // });
  // it("works with segment array", () => {
  //   let c = new Categories();
  //   let opt: FindOptions<Categories> = { orderBy: c => [{ column: c.id }, { column: c.categoryName }] };
  //   let s = entityOrderByToSort(c, opt.orderBy);
  //   expect(s.Segments.length).toBe(2);
  //   expect(s.Segments[0].column).toBe(c.id);
  //   expect(s.Segments[1].column).toBe(c.categoryName);
  // });
  // it("works with mixed column segment array", () => {
  //   let c = new Categories();
  //   let opt: FindOptions<Categories> = { orderBy: c => [c.id, { column: c.categoryName }] };
  //   let s = entityOrderByToSort(c, opt.orderBy);
  //   expect(s.Segments.length).toBe(2);
  //   expect(s.Segments[0].column).toBe(c.id);
  //   expect(s.Segments[1].column).toBe(c.categoryName);
  // });
  // itAsync("test several sort options", async () => {
  //   let c = await createData(async i => {
  //     await i(1, 'z');
  //     await i(2, 'y');
  //   });

  //   let r = await c.find({ orderBy: c => c.categoryName });
  //   expect(r.length).toBe(2);
  //   expect(r[0].id).toBe(2);

  //   r = await c.find({ orderBy: c => [c.categoryName] });
  //   expect(r.length).toBe(2);
  //   expect(r[0].id).toBe(2);

  //   r = await c.find({ orderBy: c => c.categoryName.descending });
  //   expect(r.length).toBe(2);
  //   expect(r[0].id).toBe(1);

  // });
});
describe("test area", () => {
  // it("works without entity", () => {
  //   let n = new NumberColumn();
  //   n.value = 5;
  //   let area = new DataAreaSettings({ columnSettings: () => [n] });
  //   expect(area.columns.items.length).toBe(1);
  //   expect(area.columns.__showArea()).toBe(true);
  //   expect(area.columns.getNonGridColumns().length).toBe(1);
  // });
});
/*describe("test Grid Settings", () => {  remember to copy to data area tests
  it("works well with many columns", () => {

    let x = new GridSettings(new Categories(), {
      columnSettings: x => [
        { caption: 'a', getValue: r => '' },
        { caption: 'b', getValue: r => '' },
        { caption: 'c', getValue: r => '' },
        { caption: 'd', getValue: r => '' },
        { caption: 'e', getValue: r => '' },
        { caption: 'f', getValue: r => '' },
        { caption: 'g', getValue: r => '' },
        { caption: 'h', getValue: r => '' },
      ]
    });
    expect(x.columns.getGridColumns().length).toBe(5);
    expect(x.columns.getNonGridColumns().length).toBe(3);
    let area = new DataAreaCompnent();
    area.settings = x;
    area.columns = 2;
    expect(area.theColumns().length).toBe(2);
    expect(area.theColumns()[0].length).toBe(2);
    expect(area.theColumns()[1].length).toBe(1);

  });
});

*/
// describe("test column value change", () => {
//   it("should fire", () => {
//     let d = new Done();
//     let x = new NumberColumn({
//       valueChange: () => d.ok()
//     });
//     x.value++;
//     d.test();
//   });
//   it("should fire 2", () => {
//     let d = new Done();
//     let x = new NumberColumn({ valueChange: () => d.ok() });

//     x.value++;
//     d.test();
//   });
// });
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
    let col = decorateColumnSettings<Date>({ dataType: Date });
    let val = col.jsonLoader.fromJson(col.jsonLoader.toJson(new Date(1976, 11, 16, 8, 55, 31, 65)));
    expect(val.toISOString()).toBe(new Date(1976, 11, 16, 8, 55, 31, 65).toISOString());
  });
  it("stores well undefined", () => {
    let col = decorateColumnSettings<Date>({ dataType: Date });
    expect(col.jsonLoader.toJson(undefined)).toBe('');
  });
  it("displays empty date well", () => {

    expect(DateDisplayValue(DateOnlyJsonLoader.fromJson(''))).toBe('');
  });
  it("displays null date well 1", () => {

    expect(DateOnlyJsonLoader.toJson(null)).toBe('');
    expect(DateTimeJsonLoader.toJson(null)).toBe('');
    expect(DateDisplayValue(null)).toBe('');
  });
  it("displays empty date well empty", () => {
    expect(DateDisplayValue(DateOnlyJsonLoader.fromJson('0000-00-00'))).toBe('');
  });
  it("date works", () => {

    expect(DateOnlyJsonLoader.toJson(new Date('1976-06-16'))).toBe('1976-06-16');

  });
  it("date Storage works 1", () => {

    let col = decorateColumnSettings<Date>({
      dataType: Date,
      dbLoader: DateOnlyDateDbLoader,
      jsonLoader: DateOnlyJsonLoader
    });
    expect(col.dbLoader.toDb(col.jsonLoader.fromJson('1976-06-16')).toLocaleDateString()).toBe(new Date(1976, 5, 16, 0, 0, 0).toLocaleDateString());
    expect(col.dbLoader.toDb(col.jsonLoader.fromJson('1976-06-16')).getDate()).toBe(16);

    let toDb = col.dbLoader.toDb(col.jsonLoader.fromJson('2021-04-26'));
    if (toDb.getTimezoneOffset() < 0)
      expect(toDb.toISOString().substr(0, 10)).toBe('2021-04-25');
    else
      expect(toDb.toISOString().substr(0, 10)).toBe('2021-04-26');

    //

  });

});
describe("Test char date storage", () => {
  let j = DateOnlyJsonLoader;

  let x = CharDateLoader;
  it("from db", () => {
    expect(j.toJson(x.fromDb('19760616'))).toBe('1976-06-16');
  });
  it("to db", () => {
    expect(x.toDb(j.fromJson('1976-06-16'))).toBe('19760616');
  });
});

describe("value list column without id and caption", () => {
  it("works with automatic id", () => {
    let col = new InputControl<TestStatus>(TestStatus.open, ValueList(TestStatus));

    col.value = TestStatus.open;
    expect(col.value).toBe(TestStatus.open);
    expect(col.inputValue).toBe('open');
    col.value = TestStatus.closed;
    expect(col.inputValue).toBe('cc');
    let options =ValueListInfo.get(TestStatus).getOptions();
    expect(options.length).toBe(3);
    expect(options[2].caption).toBe('hh');
    expect(options[2].id).toBe('hold');

  })
})
describe("relation", () => {
  itAsync("should get values", async () => {

    let c = await insertFourRows();
    let r = new OneToMany(c, {
      where: x => x.description.isEqualTo("x")
    });
    let rows = await r.waitLoad();
    expect(rows.length).toBe(2);
    let n = r.create();
    expect(n.description).toBe("x");
  });
  itAsync("should have an array and lazy load it", async () => {
    let c = await insertFourRows();
    let r = new OneToMany(c, {
      where: x => x.description.isEqualTo("x")
    });
    let arr = r.items;
    expect(arr.length).toBe(0);
    await r.waitLoad();
    expect(arr.length).toBe(2);

  });
});
describe("context", () => {
  it("what", () => {
    var c = new Context();
    expect(c.isSignedIn()).toBe(false);
    expect(c.user.id).toBe(undefined);
    expect(c.user.name).toBe("");
    expect(c.user.roles.length).toBe(0);
    c.setUser({
      id: '1',
      name: 'name',
      roles: ["a"]
    });
    expect(c.isSignedIn()).toBe(true);
    c.setUser(undefined);
    expect(c.isSignedIn()).toBe(false);
    expect(c.user.id).toBe(undefined);
    expect(c.user.name).toBe("");
    expect(c.user.roles.length).toBe(0);

  });


});
describe("test grid basics", () => {
  itAsync("basically works", async () => {
    let c = await insertFourRows();
    let gs = new GridSettings(c);
    await gs.reloadData();
    expect(gs.columns.items.length).toBe(6);
    expect(gs.columns._getColDisplayValue(gs.columns.items[0], gs.items[0])).toBe("1");


  });
});

@EntityDecorator<TestCategories1>({ key: '123' })
class TestCategories1 extends newCategories {
  @ColumnDecorator({
    validate: Validators.required
  })
  a: string;
}
describe("test ", () => {
  itAsync("Test Validation,", async () => {
    var context = new ServerContext(new InMemoryDataProvider());

    var c = context.for(TestCategories1);
    var cat = c.create();
    cat.a = '';
    var saved = false;
    try {
      await c.save(cat);
      saved = true;
    }
    catch (err) {
      expect(getEntityOf(cat).columns.a.error).toEqual("Should not be empty");
    }
    expect(saved).toBe(false);

  });
});

class myDp extends ArrayEntityDataProvider {
  constructor(entity: EntityDefinitions) {
    super(entity, []);
  }
  public update(id: any, data: any): Promise<any> {
    throw new Error("what");
  }
}






class mockColumnDefs implements ColumnDefinitions {
  constructor(public dbName: string) {

  }
  target: ClassType<any>;
  readonly: boolean;
  readonly dbReadOnly: boolean;
  readonly isServerExpression: boolean;
  readonly key: string;
  readonly caption: string;
  readonly inputType: string;

  readonly dbLoader: dbLoader<any> = { toDb: x => x, fromDb: x => x };
  readonly jsonLoader: jsonLoader<any>;
  readonly inputLoader: inputLoader<any>;
  readonly dataType: any;
  readonly allowNull: boolean;
  readonly dbType: string;
}