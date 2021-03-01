


import { FindOptions, EntityProvider } from './data-interfaces';
import { Column } from './column';
import { Entity } from './entity';
import { Sort } from './sort';

import { AndFilter } from './filter/filter-interfaces';
import { StringColumn } from './columns/string-column';
import { UserInfo, SpecificEntityHelper } from './context';
import { Filter } from './filter/filter-interfaces';
import { extractWhere, unpackWhere } from './filter/filter-consumer-bridge-to-url-builder';

export class DataApi<T extends Entity = Entity> {
  getRoute() {
    if (!this.options.name)
      return this.entityProvider.create().defs.name;
    return this.options.name;
  }
  options: DataApiSettings<T>;
  constructor(private entityProvider: SpecificEntityHelper<any, T>) {
    this.options = entityProvider._getApiSettings();
  }

  async get(response: DataApiResponse, id: any) {
    if (this.options.allowRead == false) {
      response.methodNotAllowed();
      return;
    }
    await this.doOnId(response, id, async row => response.success(this.entityProvider.toApiPojo(row)));
  }
  async count(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    try {

      response.success({ count: +await this.entityProvider.count(t => this.buildWhere(t, request, filterBody)) });
    } catch (err) {
      response.error(err);
    }
  }

  async getArray(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    if (this.options.allowRead == false) {
      response.methodNotAllowed();
      return;
    }
    try {
      let findOptions: FindOptions<T> = {};
      if (this.options && this.options.get) {
        Object.assign(findOptions, this.options.get);
      }
      findOptions.where = t => this.buildWhere(t, request, filterBody);
      if (request) {

        let sort = <string>request.get("_sort");
        if (sort != undefined) {
          let dir = request.get('_order');
          let dirItems: string[] = [];
          if (dir)
            dirItems = dir.split(',');
          findOptions.orderBy = x => {
            let r = new Sort();
            sort.split(',').forEach((name, i) => {
              let col = x.columns.find(name.trim());
              if (col) {
                r.Segments.push({
                  column: col,
                  descending: i < dirItems.length && dirItems[i].toLowerCase().trim().startsWith("d")
                });
              }
            });
            return r;
          }

        }
        let limit = +request.get("_limit");
        if (!limit)
          limit = 25;
        findOptions.limit = limit;
        findOptions.page = +request.get("_page");

      }
      await this.entityProvider.find(findOptions)
        .then(async r => {
          response.success(await Promise.all(r.map(async y => this.entityProvider.toApiPojo(y))));
        });
    }
    catch (err) {
      response.error(err);
    }
  }
  private buildWhere(rowType: T, request: DataApiRequest, filterBody: any) {
    var where: Filter;
    if (this.options && this.options.get && this.options.get.where)
      where = this.options.get.where(rowType);
    if (request) {
      where = new AndFilter(where, extractWhere(rowType, request));
    }
    if (filterBody)
      where = new AndFilter(where, unpackWhere(rowType, filterBody))
    return where;
  }



  private async doOnId(response: DataApiResponse, id: any, what: (row: T) => Promise<void>) {
    try {



      await this.entityProvider.find({
        where: x => {
          let where: Filter = x.columns.idColumn.isEqualTo(id);
          if (this.options && this.options.get && this.options.get.where)
            where = new AndFilter(where, this.options.get.where(x));
          return where;
        }
      })
        .then(async r => {
          if (r.length == 0)
            response.notFound();
          else if (r.length > 1)
            response.error({ message: "id is not unique" });
          else
            await what(r[0]);
        });
    } catch (err) {
      response.error(err);
    }
  }
  async put(response: DataApiResponse, id: any, body: any) {
    if (!this.options.allowUpdate) {
      response.methodNotAllowed();
      return;
    }
    await this.doOnId(response, id, async row => {
      this.entityProvider._updateEntityBasedOnApi(row, body);
      await row.save();
      response.success(this.entityProvider.toApiPojo(row));
    });
  }
  async delete(response: DataApiResponse, id: any) {
    if (!this.options.allowDelete) {
      response.methodNotAllowed();
      return;
    }
    await this.doOnId(response, id, async row => {
      await row.delete();
      response.deleted();
    });
  }


  async post(response: DataApiResponse, body: any) {
    if (!this.options.allowInsert) {
      response.methodNotAllowed();
      return;
    }
    try {

      let r = this.entityProvider._updateEntityBasedOnApi(this.entityProvider.create(), body);

      await r.save();
      response.created(this.entityProvider.toApiPojo(r));
    } catch (err) {
      response.error(err);
    }
  }

}
export interface DataApiSettings<rowType extends Entity> {
  allowUpdate?: boolean,
  allowInsert?: boolean,
  allowDelete?: boolean,
  name?: string,
  allowRead?: boolean,
  get?: FindOptions<rowType>

}

export interface DataApiResponse {
  success(data: any): void;
  deleted(): void;
  created(data: any): void;
  notFound(): void;
  error(data: DataApiError): void;
  methodNotAllowed(): void;
  forbidden(): void;
  progress(progress: number): void;

}



export interface DataApiError {
  message: string;
}
export interface DataApiRequest {
  getBaseUrl(): string;
  get(key: string): any;
  getHeader(key: string): string;
  user: UserInfo;
  clientIp: string;
}
export interface DataApiServer {
  addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest) => Promise<boolean>): void;

}
