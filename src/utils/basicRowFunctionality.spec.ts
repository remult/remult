import { itAsync } from './testHelper';

import { Category } from './../app/models';
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
    let x = new Category();
    let y = new Category();
    x.categoryName.value = 'noam';
    y.categoryName.value = 'yael';
    expect(x.categoryName.value).toBe('noam');
    expect(y.categoryName.value).toBe('yael');
  })


});
