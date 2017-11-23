import { itAsync } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';

describe('Test basic row functionality', () => {
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



});
