import { customUrlToken, buildFilterFromRequestParameters } from './filter/filter-interfaces';
import { Remult } from './context';
import { Filter } from './filter/filter-interfaces';
import { FindOptions, Repository, rowHelperImplementation, EntityFilter, ForbiddenError } from './remult3';
import { ErrorInfo } from './data-interfaces';

export class DataApi<T = any> {

  constructor(private repository: Repository<T>, private remult: Remult) {
    remult.__enforceApiRules = true;
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
  static defaultGetLimit = 0;
  async get(response: DataApiResponse, id: any) {

    await this.doOnId(response, id, async row => response.success(this.repository.getEntityRef(row).toApiJson()));

  }
  catch(err: any, response: DataApiResponse) {
    if (ForbiddenError.isForbiddenError(err))
      response.forbidden();
    else
      response.error(err);
  }
  async count(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {

    try {
      response.success({ count: +await this.repository.count(await this.buildWhere(request, filterBody)) });
    } catch (err) {
      this.catch(err, response);
    }
  }


  async getArray(response: DataApiResponse, request: DataApiRequest, filterBody?: any) {
    try {
      let findOptions: FindOptions<T> = { load: () => [] };
      findOptions.where = await this.buildWhere(request, filterBody);

      if (request) {

        let sort = <string>request.get("_sort");
        if (sort != undefined) {
          let dir = request.get('_order');
          findOptions.orderBy = determineSort(sort, dir);

        }
        let limit = +request.get("_limit");
        if (!limit && DataApi.defaultGetLimit)
          limit = DataApi.defaultGetLimit;
        findOptions.limit = limit;
        findOptions.page = +request.get("_page");

      }
      await this.repository.find(findOptions)
        .then(async r => {
          response.success(await Promise.all(r.map(async y => this.repository.getEntityRef(y).toApiJson())));
        });
    }
    catch (err) {
      this.catch(err, response);
    }
  }
  private async buildWhere(request: DataApiRequest, filterBody: any): Promise<EntityFilter<any>> {
    var where: EntityFilter<any>[] = [];

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
        where: { $and: [this.repository.metadata.options.apiPrefilter, this.repository.metadata.idMetadata.getIdFilter(id)] } as EntityFilter<any>
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
      this.catch(err, response);
    }
  }
  async put(response: DataApiResponse, id: any, body: any) {

    await this.doOnId(response, id, async row => {
      let ref = this.repository.getEntityRef(row) as rowHelperImplementation<T>;
      await ref._updateEntityBasedOnApi(body);
      if (!ref.apiUpdateAllowed) {
        response.forbidden();
        return;
      }
      await this.repository.getEntityRef(row).save();
      response.success(this.repository.getEntityRef(row).toApiJson());
    });
  }

  async delete(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async row => {

      if (!this.repository.getEntityRef(row).apiDeleteAllowed) {
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
      if (!this.repository.getEntityRef(newr).apiInsertAllowed) {
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