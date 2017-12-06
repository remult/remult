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

}
export interface DataApiResponse {
  success(data: any): void;
  notFound(): void;
  error(data: DataApiError): void;
}

export interface DataApiError {
  message: string;

}
