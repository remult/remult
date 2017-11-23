
import { Entity, Column, Sort } from './data';
import { DataSettings ,Lookup} from './utils';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from './inMemoryDatabase'
import { itAsync } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';
import { error } from 'util';




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
  let insertFourRows = async () => {
    let c = new Categories();
    c.setSource(new InMemoryDataProvider());
    await c.source.Insert(x => {
      x.id.value = 1;
      x.categoryName.value = 'noam';
      x.description.value = 'x';
    });
    await c.source.Insert(x => {
      x.id.value = 4;
      x.categoryName.value = 'yael';
      x.description.value = 'x';
    });
    await c.source.Insert(x => {
      x.id.value = 2;
      x.categoryName.value = 'yoni';
      x.description.value = 'y';
    });
    await c.source.Insert(x => {
      x.id.value = 3;
      x.categoryName.value = 'maayan';
      x.description.value = 'y';
    });
    return c;
  };
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
    let ds = new DataSettings<Categories>(c.source, {
      get: {
        orderBy: new Sort({ column: c.id })
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
    let lookup = new Lookup(c.source);
    let r = await lookup.whenGet(c.categoryName.isEqualTo(undefined));
    expect(r.categoryName.value).toBe(undefined);

  });
});


class myDp<T extends Entity> extends ActualInMemoryDataProvider<T> {
  public update(id: any, data: any): Promise<any> {
    throw new Error("what");
  }
}

