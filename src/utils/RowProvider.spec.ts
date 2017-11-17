import { InMemoryDataProvider } from './data';
import { itAsync, MockDataHelper } from './testHelper';
import { DataHelper } from './data';
import { Category } from './../app/models';
import { TestBed, async } from '@angular/core/testing';


describe("test row provider", () => {
  itAsync("test1",async () => {
    let x = new InMemoryDataProvider(() => new Category());
    let rows = await x.find();
    expect(rows.length).toBe(0);
    var c = x.createNewItem();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    await c.save();
    rows = await x.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });
});
