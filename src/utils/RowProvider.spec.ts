import {  Entity } from './data';
import { itAsync, MockDataHelper } from './testHelper';
import { DataHelper } from './data';
import { Category, Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';


describe("test row provider", () => {
  itAsync("Insert", async () => {
    var source = new Categories();
    let rows = await source.find();
    expect(rows.length).toBe(0);
    await source.Insert(c => {
      c.id.value = 1;
      c.categoryName.value = 'noam';
    });
    rows = await source.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("Insert another way", async () => {
    let x = new Categories();
    let rows = await x.find();
    expect(rows.length).toBe(0);
    var c = new Category();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    await x.insertItem(c);
    rows = await x.find();
    expect(rows.length).toBe(1);
    expect(rows[0].id.value).toBe(1);
    expect(rows[0].categoryName.value).toBe('noam');
  });

  itAsync("one more insert", async () => {
    let x = new Categories();
    var c = x.createNewItem();
    c.id.value = 1;
    c.categoryName.value = 'noam';
    c.save();
    var r = await x.find();
    expect(r[0].categoryName.value).toBe('noam');
  });

});


