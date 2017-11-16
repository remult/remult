import { DataHelper } from './data';
import { Category } from './../app/models';
import { TestBed, async } from '@angular/core/testing';
import { promise } from 'selenium-webdriver';

function itAsync(name: string, runAsync: () => Promise<any>) {
  it(name, (done: DoneFn) => {
    runAsync().catch(e => {
      fail(e);
      done();
    })
      .then(done, e => {
        fail(e);
        done();
      });
  });
}
class MockDataHelper implements DataHelper {
  update: (id: any, data: any) => Promise<any>;
  delete: (id: any) => Promise<void>;
  insert: (data: any) => Promise<any>;
}

describe('this is my test', () => {


  it("my tests", () => {
    expect(1 + 1).toBe(2);
  });


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


  it("works with prepared Data", () => {
    let x = new Category();
    x.__setOriginalData(new MockDataHelper(), {
      id: 1,
      categoryName: 'noam'
    });
    expect(x.categoryName.value).toBe('noam');
    x.categoryName.value = 'yael';
    expect(x.categoryName.value).toBe('yael');
  });

  itAsync("updates it's data on save", async () => {
    let mdh = new MockDataHelper();
    mdh.update = (id, data) => {
      expect(id).toBe(1);
      expect(data.id).toBe(3);

      return Promise.resolve({ id: 3, categoryName: 'yael' });
    }
    var x = new Category();
    x.__setOriginalData(mdh, { id: 1, categoryName: 'noam' });
    x.id.value = 3;
    await x.save();
    expect(x.id.value).toBe(3);
    expect(x.categoryName.value).toBe('yael');
  });

  itAsync("test Insert", async () => {
    let mdh = new MockDataHelper();
    mdh.insert = (data) => {
      expect(data.categoryName).toBe('noam');
      console.log('in insert');
      return Promise.resolve({
        id: 1,
        categoryName: 'noam'
      });
    };
    mdh.update = (id, data) => {
      expect(id).toBe(1);
      return Promise.resolve(data);
    };
    var r = new Category();
    r.__setOriginalData(mdh, undefined);
    r.categoryName.value = 'noam';
    await r.save();
    console.log('on end');
    expect(r.id.value).toBe(1);
    expect(r.categoryName.value).toBe('noam');
  });
});
