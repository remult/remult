import { EntityOptions } from './entity';
import { AndFilter, customUrlToken, buildFilterFromRequestParameters } from './filter/filter-interfaces';
import { Remult, UserInfo } from './context';
import { Filter } from './filter/filter-interfaces';
import { FindOptions, Repository, EntityRef, rowHelperImplementation, EntityFilter } from './remult3';
import { SortSegment } from './sort';
import { ErrorInfo } from './data-interfaces';

export class DataApi<T = any> {

  options: DataApiSettings<T>;
  constructor(private repository: Repository<T>, private remult: Remult) {
    this.options = this._getApiSettings();
  }
  httpGet(res: DataApiResponse, req: DataApiRequest) {
    if (req.get("__action") == "count") {
      return this.count(res, req);
    } else
      return this.getArray(res, req);
  }
  httpPost(res: DataApiResponse, req: DataApiRequest, body: any) {
    switch (req.get("__action")) {
      case "get":
        return this.getArray(res, req, body);
      case "count":
        return this.count(res, req, body);
      default:
        return this.post(res, body);
    }
  }

  async get(response: DataApiResponse, id: any) {
    if (this.options.allowRead == false) {
      response.forbidden();
      return;
    }
    await this.doOnId(response, id, async row => response.success(this.repository.getEntityRef(row).toApiJson()));
  }
  async count(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    try {

      response.success({ count: +await this.repository.count(this.buildWhere(request, filterBody)) });
    } catch (err) {
      response.error(err);
    }
  }

  async getArray(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    if (this.options.allowRead == false) {
      response.forbidden();
      return;
    }
    try {
      let findOptions: FindOptions<T> = { load: () => [] };
      if (this.options && this.options.get) {
        Object.assign(findOptions, this.options.get);
      }
      findOptions.where = this.buildWhere(request, filterBody);
      if (this.options.requireId) {
        let hasId = false;
        let w = await Filter.fromEntityFilter(this.repository.metadata, findOptions.where);
        if (w) {
          w.__applyToConsumer({
            containsCaseInsensitive: () => { },
            isDifferentFrom: () => { },
            isEqualTo: (col, val) => {
              if (this.repository.metadata.idMetadata.isIdField(col))
                hasId = true;
            },
            custom: () => { },
            databaseCustom: () => { },
            isGreaterOrEqualTo: () => { },
            isGreaterThan: () => { },
            isIn: () => { },
            isLessOrEqualTo: () => { },
            isLessThan: () => { },
            isNotNull: () => { },
            isNull: () => { },

            or: () => { }
          });
        }
        if (!hasId) {
          response.forbidden();
          return
        }
      }
      if (request) {

        let sort = <string>request.get("_sort");
        if (sort != undefined) {
          let dir = request.get('_order');
          findOptions.orderBy = determineSort(sort, dir);

        }
        let limit = +request.get("_limit");
        if (!limit)
          limit = 200;
        findOptions.limit = limit;
        findOptions.page = +request.get("_page");

      }
      await this.repository.find(findOptions)
        .then(async r => {
          response.success(await Promise.all(r.map(async y => this.repository.getEntityRef(y).toApiJson())));
        });
    }
    catch (err) {
      response.error(err);
    }
  }
  private buildWhere(request: DataApiRequest, filterBody: any): EntityFilter<any> {
    var where: EntityFilter<any>[] = [];

    where.push(this.options?.get?.where);
    if (request) {
      where.push(buildFilterFromRequestParameters(this.repository.metadata, {
        get: key => {
          let result = request.get(key);
          if (key.startsWith(customUrlToken) && result)
            return JSON.parse(result);
          return result;
        }
      }));
    }
    if (filterBody)
      where.push(Filter.entityFilterFromJson(this.repository.metadata, filterBody))
    return { $and: where };
  }



  private async doOnId(response: DataApiResponse, id: any, what: (row: T) => Promise<void>) {
    try {



      await this.repository.find({
        where: { $and: [this.options?.get?.where, this.repository.metadata.idMetadata.getIdFilter(id)] } as EntityFilter<any>
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
      await (this.repository.getEntityRef(row) as rowHelperImplementation<T>)._updateEntityBasedOnApi(body);
      if (!this._getApiSettings().allowUpdate(row)) {
        response.forbidden();
        return;
      }
      await this.repository.getEntityRef(row).save();
      response.success(this.repository.getEntityRef(row).toApiJson());
    });
  }
  _getApiSettings(): DataApiSettings<T> {

    let options = this.repository.metadata.options;
    if (options.allowApiCrud !== undefined) {
      if (options.allowApiDelete === undefined)
        options.allowApiDelete = options.allowApiCrud;
      if (options.allowApiInsert === undefined)
        options.allowApiInsert = options.allowApiCrud;
      if (options.allowApiUpdate === undefined)
        options.allowApiUpdate = options.allowApiCrud;
      if (options.allowApiRead === undefined)
        options.allowApiRead = options.allowApiCrud;
    }

    return {
      allowRead: this.remult.isAllowed(options.allowApiRead),
      allowUpdate: (e) => this.remult.isAllowedForInstance(e, options.allowApiUpdate),
      allowDelete: (e) => this.remult.isAllowedForInstance(e, options.allowApiDelete),
      allowInsert: (e) => this.remult.isAllowedForInstance(e, options.allowApiInsert),
      requireId: this.remult.isAllowed(options.apiRequireId),
      get: {
        where: options.apiPrefilter

      }
    }
  }
  async delete(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async row => {

      if (!this._getApiSettings().allowDelete(row)) {
        response.forbidden();
        return;
      }
      await this.repository.getEntityRef(row).delete();
      response.deleted();
    });
  }


  async post(response: DataApiResponse, body: any) {

    try {
      let newr = this.repository.create();
      await (this.repository.getEntityRef(newr) as rowHelperImplementation<T>)._updateEntityBasedOnApi(body);
      if (!this._getApiSettings().allowInsert(newr)) {
        response.forbidden();
        return;
      }

      await this.repository.getEntityRef(newr).save();
      response.created(this.repository.getEntityRef(newr).toApiJson());
    } catch (err) {
      response.error(err);
    }
  }

}
export interface DataApiSettings<rowType> {
  allowUpdate: (row: rowType) => boolean,
  allowInsert: (row: rowType) => boolean,
  allowDelete: (row: rowType) => boolean,
  requireId: boolean,
  allowRead?: boolean,
  get?: FindOptions<rowType>

}

export interface DataApiResponse {
  success(data: any): void;
  deleted(): void;
  created(data: any): void;
  notFound(): void;
  error(data: ErrorInfo): void;
  forbidden(): void;
  progress(progress: number): void;

}




export interface DataApiRequest {
  get(key: string): any;
}
export function determineSort(sortUrlParm: string, dirUrlParam: string) {
  let dirItems: string[] = [];
  if (dirUrlParam)
    dirItems = dirUrlParam.split(',');
  let result: any = {};
  sortUrlParm.split(',').map((name, i) => {
    let key = name.trim();
    if (i < dirItems.length && dirItems[i].toLowerCase().trim().startsWith("d"))
      return result[key] = "desc";
    else
      return result[key] = "asc";
  });
  return result;

}



export function serializeError(data: ErrorInfo) {
  if (data instanceof TypeError) {
    data = { message: data.message, stack: data.stack };
  }
  let x = JSON.parse(JSON.stringify(data));
  if (!x.message && !x.modelState)
    data = { message: data.message, stack: data.stack };
  if (typeof x === 'string')
    data = { message: x };
  return data;
}