import { itAsync, MockDataHelper } from './testHelper';
import { DataHelper } from './dataInterfaces';
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


  it("works with prepared Data", () => {
    let x = new Category();
    x.__entityData.setData({
      id: 1,
      categoryName: 'noam'
    });
    expect(x.categoryName.value).toBe('noam');
    x.categoryName.value = 'yael';
    expect(x.categoryName.value).toBe('yael');
  });

  itAsync("updates it's data on save", async () => {
    let mdh = new MockDataHelper({
      update: async (id, data) => {
        expect(id).toBe(1);
        expect(data.id).toBe(3);
        return { id: 3, categoryName: 'yael' };
      }
    });
    var x = new Category();
    x.__entityData.setHelper(mdh, { id: 1, categoryName: 'noam' });
    x.id.value = 3;
    await x.save();
    expect(x.id.value).toBe(3);
    expect(x.categoryName.value).toBe('yael');
  });

  itAsync("test Insert", async () => {
    let mdh = new MockDataHelper({
      insert: async (data) => {
        expect(data.categoryName).toBe('noam');
        return { id: 1, categoryName: 'noam' };

      },
    });
    var r = new Category();
    r.__entityData.setHelper(mdh, undefined);
    r.categoryName.value = 'noam';
    await r.save();
    expect(r.id.value).toBe(1);
    expect(r.categoryName.value).toBe('noam');
  });
  itAsync("test reset", async () => {
    var r = new Category();
    r.__entityData.setHelper(new MockDataHelper(), { id: 3, categoryName: 'noam' });
    expect(r.categoryName.value).toBe('noam');
    r.categoryName.value = 'yael';
    expect(r.categoryName.value).toBe('yael');
    r.reset();
    expect(r.categoryName.value).toBe('noam');
  });
});
