import { Entity } from './Data';

import { dataAreaSettings } from './utils';
import { FilterBase, DataProviderFactory, DataProvider, ColumnValueProvider, iDataColumnSettings, FindOptions } from './dataInterfaces';


import { isFunction, makeTitle } from './common';


export class InMemoryDataProvider implements DataProviderFactory {
  rows: any[]=[];
  public provideFor<T extends Entity>(name: string): DataProvider {
    return new ActualInMemoryDataProvider(this.rows);
  }
}



export class ActualInMemoryDataProvider<T extends Entity> implements DataProvider {



  constructor(private rows?: any[]) {
    if (!rows)
      rows = [];
  }

  async find(options?: FindOptions): Promise<any[]> {

    let rows = this.rows;
    if (options) {
      if (options.where) {
        rows = rows.filter(i => {
          let ok = true;
          options.where.__addToUrl((key, val) => {
            if (i[key] != val)
              ok = false;
          });
          return ok;
        });
      }
      if (options.orderBy) {
        rows = rows.sort((a: any, b: any) => {
          let r = 0;
          for (let i = 0; i < options.orderBy.Segments.length; i++) {
            let seg = options.orderBy.Segments[i];
            let left = a[seg.column.key];
            let right = b[seg.column.key];
            if (left > right)
              r = 1;
            else if (left < right)
              r = -1;
            if (r != 0) {
              if (seg.descending)
                r *= -1;
              return r;
            }
          }
          return r;
        });
      }
    }
    return rows.map(i => {

      return JSON.parse(JSON.stringify(i));

    });
  }



  public update(id: any, data: any): Promise<any> {
    for (let i = 0; i < this.rows.length; i++) {
      if (id == this.rows[i].id) {
        this.rows[i] = Object.assign({}, this.rows[i], data);
        return Promise.resolve(this.rows[i]);
      }
      throw new Error("could'nt find id to update: " + id);
    }
  }

  public delete(id: any): Promise<void> {
    for (let i = 0; i < this.rows.length; i++) {
      if (id == this.rows[i].id) {
        this.rows.splice(i, 1);
        return Promise.resolve();
      }
      throw new Error("could'nt find id to delete: " + id);
    }
  }

  public insert(data: any): Promise<any> {
    this.rows.forEach(i => {
      if (data.id == i.id)
        throw Error("id already exists");
    });
    this.rows.push(JSON.parse(JSON.stringify(data)));
    return Promise.resolve(JSON.parse(JSON.stringify(data)));
  }
}
