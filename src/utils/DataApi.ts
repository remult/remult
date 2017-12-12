import { DataApiError } from './DataApi';

import { Entity, AndFilter, Sort } from './utils';
import { FindOptions } from './DataInterfaces';

export class DataApi {
  constructor(private rowType: Entity<any>) {

  }
  async get(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async row => response.success(row.__toPojo()));
  }
  async getArray(response: DataApiResponse, request: DataApiRequest) {
    try {
      let findOptions: FindOptions = {};
      if (request) {


        this.rowType.__iterateColumns().forEach(col => {
          let val = request.get(col.jsonName);
          if (val != undefined) {
            let f = col.isEqualTo(val);
            if (findOptions.where)
              findOptions.where = new AndFilter(findOptions.where, f);
            else
              findOptions.where = f;
          }
        });
      
        let sort = request.get("_sort");
        if (sort != undefined) { 
          let dir = request.get('_order');
          let dirItems:string[] = [];
          if (dir)
            dirItems = dir.split(',');
          findOptions.orderBy = new Sort();
          sort.split(',').forEach((name,i) => { 
            let col = this.rowType.__getColumnByKey(name);
            if (col) { 
              findOptions.orderBy.Segments.push({
                column: col,
                descending:i<dirItems.length&&dirItems[i].toLowerCase().startsWith("d")
              });
            }
          });
        }  

      }
      await this.rowType.source.find(findOptions)
        .then(r => {
          response.success(r.map(y => y.__toPojo()));
        });
    }
    catch (err) {
      response.error({ message: err.message });
    }
  }
  private async doOnId(response: DataApiResponse, id: any, what: (row: Entity<any>) => Promise<void>) {
    try {
      await this.rowType.source.find({ where: this.rowType.__idColumn.isEqualTo(id) })
        .then(r => {
          if (r.length == 0)
            response.notFound();
          else if (r.length > 1)
            response.error({ message: "id is not unique" });
          else what(r[0]);
        });
    } catch (err) { 
      response.error({ message: err.message });
    }
  }
  async put(response: DataApiResponse, id: any, body: any) {
    await this.doOnId(response, id, async row => {
      row.__fromPojo(body);
      row.save();
      response.success(row.__toPojo());
    });
  }
  async delete(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async row => {
      row.delete();
      response.success({});
    });
  }
  async post(response: DataApiResponse, body: any) {
    try {

      let r = await this.rowType.source.Insert(r => r.__fromPojo(body))
      response.success(r.__toPojo());
    } catch (err) {
      let p = err as Promise<any>;
      if (p.then) {
        err = await p;
      }
      response.error(err);
    }
  }

}
export interface DataApiResponse {
  success(data: any): void;
  notFound(): void;
  error(data: DataApiError): void;
}
export interface DataApiRequest {
  get(key: string): string;
}

export interface DataApiError {
  message: string;

}
