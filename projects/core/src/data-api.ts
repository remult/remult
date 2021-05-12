import {  EntityOptions } from './entity';
import { AndFilter } from './filter/filter-interfaces';
import { UserInfo } from './context';
import { Filter } from './filter/filter-interfaces';
import { FindOptions, Repository, TheSort } from './remult3';

export class DataApi<T=any> {
  getRoute() {
    return this.options.name;
  }
  options: DataApiSettings<T>;
  constructor(private repository: Repository<T>) {
    this.options = repository._getApiSettings();
  }

  async get(response: DataApiResponse, id: any) {
    if (this.options.allowRead == false) {
      response.methodNotAllowed();
      return;
    }
    await this.doOnId(response, id, async row => response.success(this.repository.getRowHelper(row).toApiPojo()));
  }
  async count(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    try {

      response.success({ count: +await this.repository.count(t => this.buildWhere(request, filterBody)) });
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
      findOptions.where = t => this.buildWhere(request, filterBody);
      if (this.options.requireId) {
        let hasId = false;
        let w = this.repository.translateWhereToFilter(findOptions.where);
        if (w) {
          w.__applyToConsumer({
            containsCaseInsensitive: () => { },
            isDifferentFrom: () => { },
            isEqualTo: (col, val) => {
                 if (this.repository.isIdColumn(col))
                   hasId = true;
            },
            isGreaterOrEqualTo: () => { },
            isGreaterThan: () => { },
            isIn: () => { },
            isLessOrEqualTo: () => { },
            isLessThan: () => { },
            isNotNull: () => { },
            isNull: () => { },
            startsWith: () => { },
            or: () => { }
          });
        }
        if (!hasId) {
          response.methodNotAllowed();
          return
        }
      }
      if (request) {

        let sort = <string>request.get("_sort");
        if (sort != undefined) {
          let dir = request.get('_order');
          let dirItems: string[] = [];
          if (dir)
            dirItems = dir.split(',');
          findOptions.orderBy = x => {

            return sort.split(',').map((name, i) => {
              let r: TheSort = x[name];
              if (i < dirItems.length && dirItems[i].toLowerCase().trim().startsWith("d"))
                return r.descending;
              return r;
            });

          }

        }
        let limit = +request.get("_limit");
        if (!limit)
          limit = 25;
        findOptions.limit = limit;
        findOptions.page = +request.get("_page");

      }
      await this.repository.find(findOptions)
        .then(async r => {
          response.success(await Promise.all(r.map(async y => this.repository.getRowHelper(y).toApiPojo())));
        });
    }
    catch (err) {
      response.error(err);
    }
  }
  private buildWhere(request: DataApiRequest, filterBody: any) {
    var where: Filter;
    if (this.options && this.options.get && this.options.get.where)
      where = this.repository.translateWhereToFilter(this.options.get.where);
    if (request) {
      where = new AndFilter(where, this.repository.extractWhere(request));
    }
    if (filterBody)
      where = new AndFilter(where, this.repository.unpackWhere(filterBody))
    return where;
  }



  private async doOnId(response: DataApiResponse, id: any, what: (row: T) => Promise<void>) {
    try {



      await this.repository.find({
        where: x => {
          let where: Filter =this.repository.getIdFilter(id) ;
          if (this.options && this.options.get && this.options.get.where)
            where = new AndFilter(where, this.repository.translateWhereToFilter(this.options.get.where));
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

    await this.doOnId(response, id, async row => {
      this.repository.getRowHelper(row)._updateEntityBasedOnApi(body);
      if (!this._getApiSettings(row).allowUpdate(row)) {
        response.methodNotAllowed();
        return;
      }
      await this.repository.getRowHelper(row).save();
      response.success(this.repository.getRowHelper(row).toApiPojo());
    });
  }
  private _getApiSettings(row: T):DataApiSettings<T>{
    return this.repository._getApiSettings();
  }
  async delete(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async row => {

      if (!this._getApiSettings(row).allowDelete(row)) {
        response.methodNotAllowed();
        return;
      }
      await this.repository.getRowHelper(row).delete();
      response.deleted();
    });
  }


  async post(response: DataApiResponse, body: any) {

    try {
      let newr = this.repository.create();
      this.repository.getRowHelper(newr)._updateEntityBasedOnApi(body);
      if (!this._getApiSettings(newr).allowInsert(newr)) {
        response.methodNotAllowed();
        return;
      }

      await this.repository.getRowHelper(newr).save();
      response.created(this.repository.getRowHelper(newr).toApiPojo());
    } catch (err) {
      response.error(err);
    }
  }

}
export interface DataApiSettings<rowType> {
  allowUpdate: (row:rowType) => boolean,
  allowInsert: (row:rowType) => boolean,
  allowDelete: (row:rowType) => boolean,
  requireId: boolean,
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
  stack?: string;
}
export interface DataApiRequest {
  getBaseUrl(): string;
  get(key: string): any;
  getHeader(key: string): string;
  user: UserInfo;
  clientIp: string;
}
