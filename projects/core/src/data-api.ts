import type { Remult } from './context.js'
import { doTransaction } from './context.js'
import type { ErrorInfo } from './data-interfaces.js'
import {
  findOptionsToJson,
  liveQueryAction,
} from './data-providers/rest-data-provider.js'
import {
  Filter,
  buildFilterFromRequestParameters,
  customUrlToken,
} from './filter/filter-interfaces.js'
import type { QueryData } from './live-query/SubscriptionServer.js'
import { getRelationFieldInfo } from './remult3/relationInfoMember.js'
import {
  GroupByCountMember,
  GroupByForApiKey,
  type GroupByOptions,
  type EntityFilter,
  type EntityMetadata,
  type FindOptions,
  type Repository,
} from './remult3/remult3.js'
import type { rowHelperImplementation } from './remult3/RepositoryImplementation.js'

import { ForbiddenError } from './server-action.js'

export class DataApi<T = unknown> {
  constructor(
    private repository: Repository<T>,
    private remult: Remult,
  ) {}
  httpGet(
    res: DataApiResponse,
    req: DataApiRequest,
    serializeContext: () => Promise<any>,
  ) {
    const action = req?.get('__action')
    if (action?.startsWith(liveQueryAction))
      return this.liveQuery(
        res,
        req,
        undefined,
        serializeContext,
        action.substring(liveQueryAction.length),
      )
    switch (action) {
      case 'get':
      case 'count':
        return this.count(res, req, undefined)
      case 'groupBy':
        return res.success(this.groupBy(req, undefined))
    }
    return this.getArray(res, req, undefined)
  }
  async httpPost(
    res: DataApiResponse,
    req: DataApiRequest,
    body: any,
    serializeContext: () => Promise<any>,
  ) {
    const action = req?.get('__action')
    function validateWhereInBody() {
      if (!body?.where) {
        throw {
          message: `POST with action ${action} must have a where clause in the body`,
          httpStatusCode: 400,
        } satisfies ErrorInfo
      }
    }
    if (action?.startsWith(liveQueryAction)) {
      validateWhereInBody()
      return this.liveQuery(
        res,
        req,
        body,
        serializeContext,
        action.substring(liveQueryAction.length),
      )
    }

    switch (action) {
      case 'get':
        validateWhereInBody()
        return this.getArray(res, req, body)
      case 'count':
        validateWhereInBody()
        return this.count(res, req, body)
      case 'groupBy':
        return res.success(this.groupBy(req, body))
      case 'deleteMany':
        validateWhereInBody()
        return this.deleteMany(res, req, body)
      case 'updateMany':
        validateWhereInBody()
        return this.updateManyImplementation(res, req, body)
      case 'endLiveQuery':
        await this.remult.liveQueryStorage!.remove(body.id)
        res.success('ok')
        return
      case 'query':
        return res.success(this.query(res, req, body))
      default:
        return this.post(res, body)
    }
  }

  async query(response: DataApiResponse, request: DataApiRequest, body: any) {
    if (!this.repository.metadata.apiReadAllowed) {
      response.forbidden()
      return
    }
    try {
      let { aggregate, ...rest } = body
      let [{ r }, [aggregates]] = await Promise.all([
        this.getArrayImpl(request, rest),
        this.groupBy(request, aggregate),
      ])
      return {
        items: r,
        aggregates,
      }
    } catch (err: any) {
      if (err.isForbiddenError) response.forbidden()
      else response.error(err, this.repository.metadata)
    }
  }
  static defaultGetLimit = 0
  async get(response: DataApiResponse, id: any) {
    if (!this.repository.metadata.apiReadAllowed) {
      response.forbidden()
      return
    }
    await this.doOnId(response, id, async (row) =>
      response.success(this.repository.getEntityRef(row).toApiJson()),
    )
  }
  async count(response: DataApiResponse, request: DataApiRequest, body?: any) {
    if (!this.repository.metadata.apiReadAllowed) {
      response.forbidden()
      return
    }
    try {
      response.success({
        count: +(await this.repository.count(
          await this.buildWhere(request, body),
        )),
      })
    } catch (err: any) {
      response.error(err, this.repository.metadata)
    }
  }
  async deleteMany(
    response: DataApiResponse,
    request: DataApiRequest,
    body?: any,
  ) {
    try {
      let deleted = 0
      let where = await this.buildWhere(request, body)
      Filter.throwErrorIfFilterIsEmpty(where, 'deleteMany')
      return await doTransaction(this.remult, async () => {
        for await (const x of this.repository.query({
          where,
          include: this.includeNone(),
          aggregate: undefined!,
        })) {
          await this.actualDelete(x)
          deleted++
        }
        response.success({ deleted })
      })
    } catch (err: any) {
      response.error(err, this.repository.metadata)
    }
  }
  async groupBy(request: DataApiRequest, body: any) {
    let findOptions = await this.findOptionsFromRequest(request, body)
    let orderBy: any = {}
    if (body?.orderBy) {
      for (const element of body?.orderBy) {
        const direction = element.isDescending ? 'desc' : 'asc'
        switch (element.operation) {
          case undefined:
            orderBy[element.field] = direction
            break

          case 'count':
            orderBy[GroupByCountMember] = direction
            break
          default:
            orderBy[element.field] = {
              ...orderBy[element.field],
              [element.operation]: direction,
            }
            break
        }
      }
    }
    const group = (body?.groupBy as any[])?.filter((x: string) =>
      this.repository.fields.find(x).includedInApi(),
    )
    let result = await this.repository.groupBy({
      where: findOptions.where,
      limit: findOptions.limit,
      page: findOptions.page,
      //@ts-expect-error internal key
      [GroupByForApiKey]: true,
      group,
      sum: (body?.sum as any[])?.filter((x: string) =>
        this.repository.fields.find(x).includedInApi(),
      ),
      avg: (body?.avg as any[])?.filter((x: string) =>
        this.repository.fields.find(x).includedInApi(),
      ),
      min: (body?.min as any[])?.filter((x: string) =>
        this.repository.fields.find(x).includedInApi(),
      ),
      max: (body?.max as any[])?.filter((x: string) =>
        this.repository.fields.find(x).includedInApi(),
      ),
      distinctCount: (body?.distinctCount as any[])?.filter((x: string) =>
        this.repository.fields.find(x).includedInApi(),
      ),
      orderBy: orderBy,
    })
    if (group)
      result.forEach((x) => {
        for (const f of group) {
          x[f] = this.repository.fields.find(f).valueConverter.toJson(x[f])
        }
      })

    return result
  }

  async getArrayImpl(request: DataApiRequest, body: any) {
    let findOptions = await this.findOptionsFromRequest(request, body)

    const r = await this.repository.find(findOptions).then(async (r) => {
      return await Promise.all(
        r.map(async (y) => this.repository.getEntityRef(y).toApiJson()),
      )
    })
    return { r, findOptions }
  }

  private async findOptionsFromRequest(request: DataApiRequest, body: any) {
    let findOptions: FindOptions<T> = {
      load: () => [],
      include: this.includeNone(),
    }
    findOptions.where = await this.buildWhere(request, body)

    if (request) {
      let sort = <string>request.get('_sort')
      if (sort != undefined) {
        let dir = request.get('_order')
        findOptions.orderBy = determineSort(sort, dir)
      }
      let limit = +request.get('_limit')
      if (!limit && DataApi.defaultGetLimit) limit = DataApi.defaultGetLimit
      findOptions.limit = limit
      findOptions.page = +request.get('_page')
    }
    if (this.remult.isAllowed(this.repository.metadata.options.apiRequireId)) {
      let hasId = false
      let w = await Filter.fromEntityFilter(
        this.repository.metadata,
        findOptions.where,
      )
      if (w) {
        w.__applyToConsumer({
          containsCaseInsensitive: () => {},
          notContainsCaseInsensitive: () => {},
          startsWithCaseInsensitive: () => {},
          endsWithCaseInsensitive: () => {},
          isDifferentFrom: () => {},
          isEqualTo: (col, val) => {
            if (this.repository.metadata.idMetadata.isIdField(col)) hasId = true
          },
          custom: () => {},
          databaseCustom: () => {},
          isGreaterOrEqualTo: () => {},
          isGreaterThan: () => {},
          isIn: (col) => {
            if (this.repository.metadata.idMetadata.isIdField(col)) hasId = true
          },
          isLessOrEqualTo: () => {},
          isLessThan: () => {},
          isNotNull: () => {},
          isNull: () => {},
          not: () => {},
          or: () => {},
        })
      }
      if (!hasId) {
        throw new ForbiddenError()
      }
    }
    return findOptions
  }

  private includeNone() {
    let include: any = {}

    for (const field of this.repository.metadata.fields) {
      if (getRelationFieldInfo(field)) {
        include[field.key] = false
      }
    }
    return include
  }

  async getArray(
    response: DataApiResponse,
    request: DataApiRequest,
    body?: any,
  ) {
    if (!this.repository.metadata.apiReadAllowed) {
      response.forbidden()
      return
    }
    try {
      const { r } = await this.getArrayImpl(request, body)

      response.success(r)
    } catch (err: any) {
      if (err.isForbiddenError) response.forbidden()
      else response.error(err, this.repository.metadata)
    }
  }
  async liveQuery(
    response: DataApiResponse,
    request: DataApiRequest,
    body: any,
    serializeContext: () => Promise<any>,
    queryChannel: string,
  ) {
    if (!this.repository.metadata.apiReadAllowed) {
      response.forbidden()
      return
    }
    try {
      const r = await this.getArrayImpl(request, body)
      const data: QueryData = {
        requestJson: await serializeContext(),
        findOptionsJson: findOptionsToJson(
          r.findOptions,
          this.repository.metadata,
        ),
        lastIds: r.r.map((y) => this.repository.metadata.idMetadata.getId(y)),
      }
      await this.remult.liveQueryStorage!.add({
        entityKey: this.repository.metadata.key,
        id: queryChannel,
        data,
      })
      response.success(r.r)
    } catch (err: any) {
      if (err.isForbiddenError) response.forbidden()
      else response.error(err, this.repository.metadata)
    }
  }
  private async buildWhere(
    request: DataApiRequest,
    body: any,
  ): Promise<EntityFilter<any>> {
    var where: EntityFilter<any>[] = []
    if (this.repository.metadata.options.apiPrefilter) {
      if (typeof this.repository.metadata.options.apiPrefilter === 'function')
        where.push(await this.repository.metadata.options.apiPrefilter())
      else where.push(this.repository.metadata.options.apiPrefilter)
    }
    if (request) {
      let f = buildFilterFromRequestParameters(this.repository.metadata, {
        get: (key) => {
          let result = body?.where?.[key]
          if (result !== undefined) return result

          result = request.get(key)
          if (
            key.startsWith(customUrlToken) &&
            result &&
            typeof result === 'string'
          )
            return JSON.parse(result)
          return result
        },
      })
      if (this.repository.metadata.options.apiPreprocessFilter) {
        f = await this.repository.metadata.options.apiPreprocessFilter(f, {
          metadata: this.repository.metadata,
          getFilterPreciseValues: async (filter?: EntityFilter<any>) => {
            return Filter.getPreciseValues(
              this.repository.metadata,
              filter || f,
            )
          },
        })
      }
      where.push(f)
    }

    return { $and: where }
  }

  private async doOnId(
    response: DataApiResponse,
    id: any,
    what: (row: T) => Promise<void>,
  ) {
    try {
      var where: EntityFilter<any>[] = [
        this.repository.metadata.idMetadata.getIdFilter(id),
      ]
      if (this.repository.metadata.options.apiPrefilter) {
        if (typeof this.repository.metadata.options.apiPrefilter === 'function')
          where.push(await this.repository.metadata.options.apiPrefilter())
        else where.push(this.repository.metadata.options.apiPrefilter)
      }

      await this.repository
        .find({
          where: { $and: where } as EntityFilter<any>,
          include: this.includeNone(),
        })
        .then(async (r) => {
          if (r.length == 0) response.notFound()
          else if (r.length > 1)
            response.error(
              {
                message:
                  `id "${id}" is not unique for entity ` +
                  this.repository.metadata.key,
              },
              this.repository.metadata,
              400,
            )
          else await what(r[0])
        })
    } catch (err: any) {
      response.error(err, this.repository.metadata)
    }
  }
  async updateManyThroughPutRequest(
    response: DataApiResponse,
    request: DataApiRequest,
    body: any,
  ) {
    const action = request?.get('__action')
    if (action == 'emptyId') {
      return this.put(response, '', body)
    }

    return this.updateManyImplementation(response, request, {
      where: undefined,
      set: body,
    })
  }
  async updateManyImplementation(
    response: DataApiResponse,
    request: DataApiRequest,
    body: { where?: any; set?: any },
  ) {
    try {
      let where = await this.buildWhere(request, body)
      Filter.throwErrorIfFilterIsEmpty(where, 'updateMany')
      return await doTransaction(this.remult, async () => {
        let updated = 0
        for await (const x of this.repository.query({
          where,
          include: this.includeNone(),
          aggregate: undefined!,
        })) {
          await this.actualUpdate(x, body.set)
          updated++
        }
        response.success({ updated })
      })
    } catch (err: any) {
      response.error(err, this.repository.metadata)
    }
  }
  async actualUpdate(row: any, body: any) {
    let ref = this.repository.getEntityRef(row) as rowHelperImplementation<T>
    await ref._updateEntityBasedOnApi(body)
    if (!ref.apiUpdateAllowed) {
      throw new ForbiddenError()
    }
    await ref.save()
    return ref
  }
  async put(response: DataApiResponse, id: any, body: any) {
    await this.doOnId(response, id, async (row) => {
      const ref = await this.actualUpdate(row, body)
      response.success(ref.toApiJson())
    })
  }
  async actualDelete(row: any) {
    if (!this.repository.getEntityRef(row).apiDeleteAllowed) {
      throw new ForbiddenError()
    }
    await this.repository.getEntityRef(row).delete()
  }

  async delete(response: DataApiResponse, id: any) {
    await this.doOnId(response, id, async (row) => {
      await this.actualDelete(row)
      response.deleted()
    })
  }

  async post(response: DataApiResponse, body: any) {
    try {
      const insert = async (what: any) => {
        let newr = this.repository.create()
        await (
          this.repository.getEntityRef(newr) as rowHelperImplementation<T>
        )._updateEntityBasedOnApi(what)
        if (!this.repository.getEntityRef(newr).apiInsertAllowed) {
          throw new ForbiddenError()
        }
        await this.repository.getEntityRef(newr).save()
        return this.repository.getEntityRef(newr).toApiJson()
      }
      if (Array.isArray(body)) {
        const result: any[] = []
        await doTransaction(this.remult, async () => {
          for (const item of body) {
            result.push(await insert(item))
          }
        })
        response.created(result)
      } else response.created(await insert(body))
    } catch (err: any) {
      if (err.isForbiddenError) response.forbidden(err.message)
      else response.error(err, this.repository.metadata)
    }
  }
}

export interface DataApiResponse {
  success(data: any): void
  deleted(): void
  created(data: any): void
  notFound(): void
  error(
    data: ErrorInfo,
    entity: EntityMetadata | undefined,
    statusCode?: number | undefined,
  ): void
  forbidden(message?: string): void
  progress(progress: number): void
}

export interface DataApiRequest {
  get(key: string): any
}
export function determineSort(sortUrlParm: string, dirUrlParam: string) {
  let dirItems: string[] = []
  if (dirUrlParam) dirItems = dirUrlParam.split(',')
  let result: any = {}
  sortUrlParm.split(',').map((name, i) => {
    let key = name.trim()
    if (i < dirItems.length && dirItems[i].toLowerCase().trim().startsWith('d'))
      return (result[key] = 'desc')
    else return (result[key] = 'asc')
  })
  return result
}

export function serializeError(data: ErrorInfo) {
  if (data instanceof TypeError) {
    data = { message: data.message, stack: data.stack }
  }
  let x = JSON.parse(JSON.stringify(data))
  if (!x.message && !x.modelState)
    data = { message: data.message, stack: data.stack }
  if (typeof x === 'string') data = { message: x }
  return data
}
