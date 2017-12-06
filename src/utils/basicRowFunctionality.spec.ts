import { createData } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from './DataApi';
import { InMemoryDataProvider } from './inMemoryDatabase';
import { itAsync } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';


class TestDataApiResponse implements DataApiResponse {
  success(data: any): void {
    fail('didnt expect success: '+JSON.stringify(data));
  }
  notFound(): void {
    fail('not found');
  }
  error(data: DataApiError) { 
    fail('error: ' + JSON.stringify( data));
  }
}

class Done {
  happened = false;
  ok() {
    this.happened = true;
  }
  test() {
    if (!this.happened)
      fail('expected to be done');
  }

}



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
  it("can be saved to a pojo", () => {
    let x = new Categories();
    x.id.value = 1;
    x.categoryName.value = 'noam';
    let y = x.__toPojo();
    expect(y.id).toBe(1);
    expect(y.categoryName).toBe('noam');
  });

});


describe("data api", () => {
  itAsync("get based on id", async () => {


    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.success = async (data: any) => {
      expect(data.id).toBe(1);
      expect(data.categoryName).toBe('noam');
      d.ok();
    };
    await api.get(1, t)
    d.test();
  });
  itAsync("get based on id can fail", async () => {
    let c = await createData(async insert => insert(1, 'noam'));

    var api = new DataApi(c);
    let t = new TestDataApiResponse();
    let d = new Done();
    t.notFound = () => d.ok();
    await api.get(2,  t);
    d.test();
  });
});

