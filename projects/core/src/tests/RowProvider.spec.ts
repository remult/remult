import { FieldMetadata, FieldOptions, ValueConverter, ValueListItem } from '../column-interfaces';
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { ArrayEntityDataProvider } from "../data-providers/array-entity-data-provider";
import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Status, TestStatus } from './testModel/models';
import { Allowed, Context, ServerContext } from '../context';
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
import { async, waitForAsync } from '@angular/core/testing';
import { Filter } from '../filter/filter-interfaces';
import { ClassType } from '../../classType';








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
}): Promise<[Repository<CategoriesForTesting>, ServerContext]> {
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
  return [rep, context];
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
  itAsync("test filter works", async () => {
    let [c] = await insertFourRows();
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
    let [c] = await insertFourRows();
    let ds = new GridSettings(c, {

      orderBy: c => c.id,
      where: c => c.categoryName.contains('a'),
      rowsInPage: 2

    });
    await ds.reloadData();
    expect(ds.items.length).toBe(2);
    expect(await c.count(ds.getFilterWithSelectedRows().where)).toBe(3);


  });

  itAsync("test filter works with user filter", async () => {
    let [c] = await insertFourRows();
    let ds = new GridSettings<CategoriesForTesting>(c, {
      orderBy: c => c.id,
      where: c => c.categoryName.contains('a'),
      rowsInPage: 2
    });
    await ds.reloadData();
    ds.filterHelper.filterRow.description = 'y';
    ds.filterHelper.filterColumn(ds.filterHelper.filterRow._.fields.description, false, false);
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

  itAsync("test filter works with selected rows", async () => {
    let [c] = await insertFourRows();
    let ds = new GridSettings<CategoriesForTesting>(c, {
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
    let [c] = await insertFourRows();
    expect(await c.count(c => c.id.isIn([1, 3]))).toBe(2);
  });
  itAsync("test all rows selected when some rows are outside the scope", async () => {
    let [c] = await insertFourRows();
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
  it("test context change event", async(async () => {
    let d = new Done();
    let c = new Context();
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

  }));

  itAsync("test select rows in page is not select all", async () => {
    let [c] = await insertFourRows();
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
    let [c] = await insertFourRows();
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
    let x = new ValueListValueConverter(Language);


    expect(x.fromJson(0)).toBe(Language.Hebrew);
    expect(x.toJson(Language.Russian)).toBe(10);

    expect(new ValueListValueConverter(Language).getOptions().length).toBe(3);
  });

  it("test auto caption", () => {
    let val = new ValueListValueConverter(valueList);
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
    expect(e._.toApiJson().l).toBe(10);
  })
  itAsync("test with entity and data defined on type", async () => {
    let c = new ServerContext(new InMemoryDataProvider())
      .for(entityWithValueList);
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


@ValueListFieldType(valueList)
class valueList {
  static firstName = new valueList();
  static listName = new valueList();
  constructor(public id?: string, public caption?: string) { }
}

@Entity({ key: 'entity with value list' })
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
    var cat = new Context().for(newCategories).create();
    expect(cat._.repository.metadata.key).toBe('Categories');
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
    let [c] = await createData(async insert => await insert(5, 'noam'));
    let r = await c.find();
    expect(r[0].categoryName).toBe('noam');
    r[0].categoryName = 'yael';
    await r[0]._.save();
    r = await c.find();
    expect(r[0].categoryName).toBe('yael');
  });

  itAsync("test filter", async () => {
    let [c] = await insertFourRows();

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
        where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.description.isEqualTo('x')))

      });
      expect(rows.length).toBe(2);
      rows = await r.find({ where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.id.isEqualTo(4))) });
      expect(rows.length).toBe(1);
      expect(rows[0].categoryName).toBe('yael');
      rows = await r.find({ where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.description.isEqualTo('y').and(c.categoryName.isEqualTo('yoni')))) });
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(2);
      rows = await r.find({ where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.id.isDifferentFrom(4).and(c.id.isDifferentFrom(2)))) });
      expect(rows.length).toBe(2);
    })

  });
  itAsync("test in filter packer", async () => {
    let [r] = await insertFourRows();
    let rows = await r.find();
    expect(rows.length).toBe(4);

    rows = await r.find({
      where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.description.isEqualTo('x')))

    });
    rows = await r.find({ where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.id.isIn([1, 3]))) });
    expect(rows.length).toBe(2);
    rows = await r.find({ where: c => Filter.unpackWhere(r.metadata, Filter.packWhere(r.metadata, c => c.id.isNotIn([1, 2, 3]))) });
    expect(rows.length).toBe(1);

  });
  itAsync("sort", async () => {
    let [c] = await insertFourRows();
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
    let [c] = await insertFourRows();
    let count = await c.count();
    expect(count).toBe(4);
  });
  itAsync("counts with filter", async () => {
    let [c] = await insertFourRows();
    let count = await c.count(c => c.id.isLessOrEqualTo(2));
    expect(count).toBe(2);
  });
  itAsync("test grid update", async () => {
    let [c] = await insertFourRows();
    let ds = new GridSettings<CategoriesForTesting>(c, {
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
    EntityDecorator({ key: '' })(type);
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

      expect(cat._.fields.a.error).toEqual("m");
      expect(cat._.error).toBe("A: m");
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
      expect(cat._.fields.a.error).toEqual("m");
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
      expect(cat._.fields.a.error).toEqual("m");
      expect(err.message).toBe("A: m");
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
          if (en._.isNew() || en.a != en._.fields.a.originalValue) {
            if (await c.count(f => f.a.isEqualTo(en.a)))
              en._.fields.a.error = 'already exists';
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
        expect(cat._.fields.a.error).toEqual("already exists");
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
        expect(cat._.fields.a.error).toEqual("already exists");
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


    let ds = new GridSettings<CategoriesForTesting>(c, {
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

    let [c] = await insertFourRows();


    let r = await c.findFirst({ createIfNotFound: true, where: c => c.categoryName.isEqualTo(undefined) });
    expect(r.categoryName).toBe(undefined);

  });
  itAsync("lookup with undefined doesn't fetch", async () => {

    let cont = new ServerContext();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.for(newCategories);

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
    await l.getAsync(c => c.id.isEqualTo(nc.value));
    expect(calledFind).toBe(false, 'expected not to call find');
    nc.value = 1;
    await l.getAsync(c => c.id.isEqualTo(nc.value));
    expect(calledFind).toBe(true);

  });
  itAsync("lookup return the same new row", async () => {
    let cont = new ServerContext();
    cont.setDataProvider({ getEntityDataProvider: (x) => new myDp(x), transaction: undefined });
    let c = cont.for(newCategories);
    var nc = { value: undefined };
    nc.value = 1;
    let lookup = new Lookup<newCategories>(c);
    let r = lookup.get(x => x.id.isEqualTo(nc.value));
    expect(getEntityRef(r).isNew()).toBe(true);
    r.id = 5;
    expect(lookup.get(x => x.id.isEqualTo(nc.value)).id).toBe(5);
    r = await lookup.getAsync(x => x.id.isEqualTo(nc.value));
    expect(r.id).toBe(5);

  });
  itAsync("lookup updates the data", async () => {
    let [c] = await createData(async insert => await insert(1, 'noam'));
    let lookup = new Lookup<CategoriesForTesting>(c);
    let r = lookup.get(c => c.id.isEqualTo(1));
    expect(r._.isNew()).toBe(true);
    expect(r.id).toBe(1);
    r = await c.findFirst({ createIfNotFound: true, where: c => c.id.isEqualTo(1) });
    expect(r._.isNew()).toBe(false);
    await r._.delete();
    expect(await c.count()).toBe(0);
    r = await c.findFirst({ createIfNotFound: true, where: c => c.id.isEqualTo(1) });
    expect(r._.isNew()).toBe(true);
    expect(r.id).toBe(1);
    await r._.save();
    expect(await c.count()).toBe(1);


  });
  itAsync("lookup survives row that doesn't exist", async () => {
    let [c] = await createData(async insert => await insert(1, 'noam'));
    let r = await c.findId(5);
    expect(r).toBeUndefined();
    r = await c.findId(5);
    expect(r).toBeUndefined();



  });

  itAsync("column drop down", async () => {
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

  itAsync("column drop down with promise", async () => {
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

  itAsync("column drop down with promise", async () => {
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
  itAsync("column drop down with items", async () => {
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

  itAsync("column drop down 1", async () => {
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
    expect(xx[0].id).toBe(1);
    expect(xx[1].id).toBe(2);
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
    let ctx = new Context();
    ctx.setDataProvider(new InMemoryDataProvider());

    let gs = new GridSettings(ctx.for(newCategories));
    gs.addArea({
      fields: x => [
        x.categoryName,
        [x.categoryName, x.categoryName]]
    });



  });


});
describe("column collection", () => {
  let ctx = new Context();
  ctx.setDataProvider(new InMemoryDataProvider());

  itAsync("uses a saparate column", async () => {
    let type = class extends newCategories {
      categoryName: string;
    }
    EntityDecorator({ key: 'asdf' })(type);
    ColumnDecorator({
      allowApiUpdate: false
    })(type.prototype, "categoryName");
    let c = ctx.for(type);


    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    await cc.add(c.metadata.fields.categoryName);
    expect(cc.items[0] === c.metadata.fields.categoryName).toBe(false);
    expect(cc.items[0] === cc.items[0].field).toBe(false);
    expect(cc.items[0].caption == c.metadata.fields.categoryName.caption).toBe(true);
    expect(cc.items[0].readonly).toBe(true);

  })

  itAsync("works ok with filter", async () => {
    let c = ctx.for(newCategories);
    var cc = new FieldCollection(() => c, () => false, new FilterHelper(() => { }, c), () => true, () => undefined);
    await cc.add(c.metadata.fields.id);
    cc.filterHelper.filterColumn(cc.items[0].field, false, false);
    expect(cc.filterHelper.isFiltered(cc.items[0].field)).toBe(true);

  });
  it("test caption etc...", waitForAsync(async () => {
    let c = ctx.for(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add(c.metadata.fields.id);
    expect(cc.items[0].caption).toBe('Id');

  }))
  it("test caption etc...", waitForAsync(async () => {
    let c = ctx.for(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add({ field: c.metadata.fields.id });
    expect(cc.items[0].caption).toBe('Id');

  }))
  it("test caption etc...", waitForAsync(async () => {
    let c = ctx.for(newCategories);
    var cc = new FieldCollection(() => c, () => false, undefined, () => true, () => undefined);
    cc.add({ field: c.metadata.fields.id, width: '100' });
    expect(cc.items[0].caption).toBe('Id');

  }))
});
describe("grid settings ",
  () => {
    let ctx = new Context();
    ctx.setDataProvider(new InMemoryDataProvider());

    it("sort is displayed right", () => {
      let s = ctx.for(newCategories);


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
      let s = ctx.for(newCategories);


      let gs = new GridSettings(s, { orderBy: c => c.categoryName });
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

      let ds = new GridSettings<CategoriesForTesting>(c, { rowsInPage: 2, where: c => c.categoryName.isEqualTo('b') });
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

@Entity({ key: 'typeA', dbName: 'dbnameA' })
class typeA extends EntityBase {

}
@Entity({ key: 'typeB' })
class typeB extends typeA {

}
describe("decorator inheritance", () => {
  it("entity extends", () => {

    let c = new ServerContext();
    let defsA = c.for(typeA).metadata;
    expect(defsA.key).toBe('typeA');
    expect(defsA.dbName).toBe('dbnameA');
    let defsB = c.for(typeB).metadata;
    expect(defsB.key).toBe("typeB");
    expect(defsB.dbName).toBe("dbnameA");;

  });

});
describe("order by api", () => {
  it("works with sort", () => {
    let c = new ServerContext().for(Categories);
    let opt: FindOptions<Categories> = { orderBy: c => c.id };
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy);
    expect(s.Segments.length).toBe(1);
    expect(s.Segments[0].field.key).toBe(c.metadata.fields.id.key);


  });


  it("works with columns array", () => {
    let c = new ServerContext().for(Categories);
    let opt: FindOptions<Categories> = { orderBy: c => [c.id, c.categoryName] };
    let s = Sort.translateOrderByToSort(c.metadata, opt.orderBy);
    expect(s.Segments.length).toBe(2);
    expect(s.Segments[0].field).toBe(c.metadata.fields.id);
    expect(s.Segments[1].field).toBe(c.metadata.fields.categoryName);
  });


  itAsync("test several sort options", async () => {
    let [c] = await createData(async i => {
      await i(1, 'z');
      await i(2, 'y');
    });

    let r = await c.find({ orderBy: c => c.categoryName });
    expect(r.length).toBe(2);
    expect(r[0].id).toBe(2);

    r = await c.find({ orderBy: c => [c.categoryName] });
    expect(r.length).toBe(2);
    expect(r[0].id).toBe(2);

    r = await c.find({ orderBy: c => c.categoryName.descending() });
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
    let col = decorateColumnSettings<Date>({ valueType: Date });
    let val = col.valueConverter.fromJson(col.valueConverter.toJson(new Date(1976, 11, 16, 8, 55, 31, 65)));
    expect(val.toISOString()).toBe(new Date(1976, 11, 16, 8, 55, 31, 65).toISOString());
  });
  it("stores well undefined", () => {
    let col = decorateColumnSettings<Date>({ valueType: Date });
    expect(col.valueConverter.toJson(undefined)).toBe('');
  });
  it("displays empty date well", () => {

    expect(DateOnlyValueConverter.displayValue(DateOnlyValueConverter.fromJson(''))).toBe('');
  });
  it("displays null date well 1", () => {

    expect(DateOnlyValueConverter.toJson(null)).toBe('');
    expect(DateOnlyValueConverter.toJson(null)).toBe('');
    expect(DateOnlyValueConverter.displayValue(null)).toBe('');
  });
  it("displays empty date well empty", () => {
    expect(DateOnlyValueConverter.displayValue(DateOnlyValueConverter.fromJson('0000-00-00'))).toBe('');
  });
  it("date works", () => {

    expect(DateOnlyValueConverter.toJson(new Date('1976-06-16'))).toBe('1976-06-16');

  });
  it("date Storage works 1", () => {

    let col = decorateColumnSettings<Date>({
      valueType: Date,
      valueConverter: DateOnlyValueConverter
    });
    expect(col.valueConverter.toDb(col.valueConverter.fromJson('1976-06-16')).toLocaleDateString()).toBe(new Date(1976, 5, 16, 0, 0, 0).toLocaleDateString());
    expect(col.valueConverter.toDb(col.valueConverter.fromJson('1976-06-16')).getDate()).toBe(16);

    let toDb = col.valueConverter.toDb(col.valueConverter.fromJson('2021-04-26'));
    if (toDb.getTimezoneOffset() < 0)
      expect(toDb.toISOString().substr(0, 10)).toBe('2021-04-25');
    else
      expect(toDb.toISOString().substr(0, 10)).toBe('2021-04-26');

    //

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
  itAsync("should get values", async () => {

    let [c] = await insertFourRows();
    let r = new OneToMany(c, {
      where: x => x.description.isEqualTo("x")
    });
    let rows = await r.load();
    expect(rows.length).toBe(2);
    let n = r.create();
    expect(n.description).toBe("x");
  });
  itAsync("should have an array and lazy load it", async () => {
    let [c] = await insertFourRows();
    let r = new OneToMany(c, {
      where: x => x.description.isEqualTo("x")
    });
    let arr = r.items;
    expect(arr.length).toBe(0);
    await r.load();
    expect(arr.length).toBe(2);

  });
});
describe("context", () => {
  it("what", () => {
    var c = new Context();
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
  itAsync("basically works", async () => {
    let [c] = await insertFourRows();
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