import { DataApiError } from './DataApi';

import { Entity } from './utils';

export class DataApi {
  constructor(private rowType: Entity<any>) {

  }
  get(id: any, response: DataApiResponse) {

    return this.rowType.source.find({ where: this.rowType.__idColumn.isEqualTo(id) })
      .then(r => {
        if (r.length == 0)
          response.notFound();
        else if (r.length > 1)
          response.error({message: "id is not unique"});
        else response.success(r[0].__toPojo());
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
