import { DataApiError } from './DataApi';

import { Entity } from './utils';

export class DataApi {
  constructor(private rowType: Entity<any>) {

  }
  async get(response: DataApiResponse, id: any) {

    await this.doOnId(response, id, async row => response.success(row.__toPojo()));
  }
  private async doOnId(response: DataApiResponse, id: any, what: (row: Entity<any>) => Promise<void>) {
    await this.rowType.source.find({ where: this.rowType.__idColumn.isEqualTo(id) })
      .then(r => {
        if (r.length == 0)
          response.notFound();
        else if (r.length > 1)
          response.error({ message: "id is not unique" });
        else what(r[0]);
      });
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

export interface DataApiError {
  message: string;

}
