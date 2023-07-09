import 'reflect-metadata'
import {
  Remult,
  AllowedForInstance,
  Allowed,
  allEntities,
  ControllerOptions,
  classHelpers,
  ClassHelper,
  setControllerSettings,
  doTransaction,
  isBackend,
} from './context'
import { buildRestDataProvider } from './buildRestDataProvider'
import { DataApiResponse } from './data-api'
import { SqlDatabase } from './data-providers/sql-database'
import { packedRowInfo } from './__EntityValueProvider'
import { DataProvider, RestDataProviderHttpProvider } from './data-interfaces'
import {
  getEntityRef,
  rowHelperImplementation,
  getFields,
  decorateColumnSettings,
  getEntitySettings,
  getControllerRef,
  EntityFilter,
  controllerRefImpl,
  RepositoryImplementation,
  FindOptions,
  Repository,
  checkTarget,
} from './remult3'
import { FieldOptions } from './column-interfaces'
import { remult } from './remult-proxy'

interface inArgs {
  args: any[]
}
interface result {
  data: any
}
export abstract class Action<inParam, outParam> implements ActionInterface {
  constructor(
    private actionUrl: string,
    private queue: boolean,
    private allowed: AllowedForInstance<any>,
  ) {}

  static apiUrlForJobStatus = 'jobStatusInQueue'
  async run(
    pIn: inParam,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ): Promise<outParam> {
    if (baseUrl === undefined) baseUrl = remult.apiClient.url
    if (!http) http = buildRestDataProvider(remult.apiClient.httpClient)

    let r = await http.post(baseUrl + '/' + this.actionUrl, pIn)
    let p: jobWasQueuedResult = r
    if (p && p.queuedJobId) {
      let progress = actionInfo.startBusyWithProgress()
      try {
        let runningJob: queuedJobInfoResponse
        await actionInfo.runActionWithoutBlockingUI(async () => {
          while (!runningJob || !runningJob.done) {
            if (runningJob)
              await new Promise((res) =>
                setTimeout(() => {
                  res(undefined)
                }, 200),
              )
            runningJob = await http.post(
              baseUrl + '/' + Action.apiUrlForJobStatus,
              { queuedJobId: r.queuedJobId },
            )
            if (runningJob.progress) {
              progress.progress(runningJob.progress)
            }
          }
        })
        if (runningJob.error) throw runningJob.error
        progress.progress(1)
        return runningJob.result
      } finally {
        progress.close()
      }
    } else return r
  }
  doWork: (
    args: any[],
    self: any,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ) => Promise<any>

  protected abstract execute(
    info: inParam,
    req: Remult,
    res: DataApiResponse,
  ): Promise<outParam>

  __register(
    reg: (
      url: string,
      queue: boolean,
      allowed: AllowedForInstance<any>,
      what: (data: any, req: Remult, res: DataApiResponse) => void,
    ) => void,
  ) {
    reg(this.actionUrl, this.queue, this.allowed, async (d, req, res) => {
      try {
        var r = await this.execute(d, req, res)
        res.success(r)
      } catch (err) {
        if (err.isForbiddenError)
          // got a problem in next with instance of ForbiddenError  - so replaced it with this bool
          res.forbidden()
        else res.error(err)
      }
    })
  }
}
export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden')
  }
  isForbiddenError: true = true
}

export class myServerAction extends Action<inArgs, result> {
  constructor(
    name: string,
    private types: any[],
    private options: BackendMethodOptions<any>,
    public originalMethod: (args: any[]) => any,
  ) {
    super(name, options.queue, options.allowed)
  }

  protected async execute(
    info: inArgs,
    remult: Remult,
    res: DataApiResponse,
  ): Promise<result> {
    let result = { data: {} }
    let ds = remult.dataProvider
    await doTransaction(remult, async () => {
      if (!remult.isAllowedForInstance(undefined, this.options.allowed))
        throw new ForbiddenError()

      info.args = await prepareReceivedArgs(
        this.types,
        info.args,
        remult,
        ds,
        res,
      )
      try {
        result.data = await this.originalMethod(info.args)
      } catch (err) {
        throw err
      }
    })
    return result
  }
}
export interface BackendMethodOptions<type> {
  /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
  allowed: AllowedForInstance<type>
  /** Used to determine the route for the BackendMethod.
   * @example
   * {allowed:true, apiPrefix:'someFolder/'}
   */
  apiPrefix?: string
  /** EXPERIMENTAL: Determines if this method should be queued for later execution */
  queue?: boolean
  /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
  blockUser?: boolean
  paramTypes?: any[]
}

export const actionInfo = {
  allActions: [] as any[],
  runningOnServer: false,
  runActionWithoutBlockingUI: <T>(what: () => Promise<T>): Promise<T> => {
    return what()
  },
  startBusyWithProgress: () => ({
    progress: (percent: number) => {},
    close: () => {},
  }),
}

export const serverActionField = Symbol('serverActionField')

interface serverMethodInArgs {
  args: any[]
  fields?: any
  rowInfo?: packedRowInfo
}
interface serverMethodOutArgs {
  result: any
  fields?: any
  rowInfo?: packedRowInfo
}

const classOptions = new Map<any, ControllerOptions>()
export function Controller(key: string) {
  return function (target, context?: any) {
    let r = target
    classOptions.set(r, { key })
    setControllerSettings(target, { key })

    return target
  }
}

export interface ClassMethodDecoratorContextStub<
  This = unknown,
  Value extends (this: This, ...args: any) => any = (
    this: This,
    ...args: any
  ) => any,
> {
  readonly kind: 'method'
  readonly name: string | symbol
  readonly access: {
    has(object: This): boolean
  }
}

/** Indicates that the decorated methods runs on the backend. See: [Backend Methods](https://remult.dev/docs/backendMethods.html) */
export function BackendMethod<type = any>(options: BackendMethodOptions<type>) {
  return (
    target: any,
    context: ClassMethodDecoratorContextStub<type> | string,
    descriptor?: any,
  ) => {
    const key = typeof context === 'string' ? context : context.name.toString()
    const originalMethod = descriptor ? descriptor.value : target
    let result = originalMethod
    checkTarget(target)
    if (target.prototype !== undefined) {
      var types: any[] = Reflect.getMetadata('design:paramtypes', target, key)
      if (options.paramTypes) types = options.paramTypes
      // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

      let serverAction = new myServerAction(
        (options?.apiPrefix ? options.apiPrefix + '/' : '') + key,
        types,
        options,
        (args) => originalMethod.apply(undefined, args),
      )
      serverAction.doWork = async (args, self, url, http) => {
        args = prepareArgsToSend(types, args)
        if (options.blockUser === false) {
          return await actionInfo.runActionWithoutBlockingUI(
            async () => (await serverAction.run({ args }, url, http)).data,
          )
        } else return (await serverAction.run({ args }, url, http)).data
      }

      result = async function (...args: any[]) {
        if (!isBackend()) {
          return await serverAction.doWork(args, undefined)
        } else return await originalMethod.apply(this, args)
      }
      registerAction(target, result)
      result[serverActionField] = serverAction
      if (descriptor) {
        descriptor.value = result
        return descriptor
      } else return result
    }

    var types: any[] = Reflect.getMetadata('design:paramtypes', target, key)
    if (options.paramTypes) types = options.paramTypes
    let x = classHelpers.get(target.constructor)
    if (!x) {
      x = new ClassHelper()
      classHelpers.set(target.constructor, x)
    }
    let serverAction: ActionInterface = {
      __register(
        reg: (
          url: string,
          queue: boolean,
          allowed: AllowedForInstance<any>,
          what: (data: any, req: Remult, res: DataApiResponse) => void,
        ) => void,
      ) {
        let c = new Remult()
        for (const constructor of x.classes.keys()) {
          let controllerOptions = x.classes.get(constructor)

          if (!controllerOptions.key) {
            controllerOptions.key = c.repo(constructor).metadata.key
          }

          reg(
            controllerOptions.key +
              '/' +
              (options?.apiPrefix ? options.apiPrefix + '/' : '') +
              key,
            options ? options.queue : false,
            options.allowed,
            async (d: serverMethodInArgs, req, res) => {
              d.args = d.args.map((x) => (isCustomUndefined(x) ? undefined : x))
              let allowed = options.allowed

              try {
                let remult = req

                let r: serverMethodOutArgs
                await doTransaction(remult, async () => {
                  d.args = await prepareReceivedArgs(
                    types,
                    d.args,
                    remult,
                    remult.dataProvider,
                    res,
                  )
                  if (allEntities.includes(constructor)) {
                    let repo = remult.repo(constructor)
                    let y: any

                    if (d.rowInfo.isNewRow) {
                      y = repo.create()
                      let rowHelper = repo.getEntityRef(
                        y,
                      ) as rowHelperImplementation<any>
                      await rowHelper._updateEntityBasedOnApi(d.rowInfo.data)
                    } else {
                      let rows = await repo.find({
                        where: {
                          ...repo.metadata.idMetadata.getIdFilter(d.rowInfo.id),
                          $and: [repo.metadata.options.apiPrefilter],
                        },
                      })
                      if (rows.length != 1)
                        throw new Error('not found or too many matches')
                      y = rows[0]
                      await (
                        repo.getEntityRef(y) as rowHelperImplementation<any>
                      )._updateEntityBasedOnApi(d.rowInfo.data)
                    }
                    if (!remult.isAllowedForInstance(y, allowed))
                      throw new ForbiddenError()
                    let defs = getEntityRef(y) as rowHelperImplementation<any>
                    await defs.__validateEntity()
                    try {
                      r = {
                        result: await originalMethod.apply(y, d.args),
                        rowInfo: {
                          data: await defs.toApiJson(),
                          isNewRow: defs.isNew(),
                          wasChanged: defs.wasChanged(),
                          id: defs.getOriginalId(),
                        },
                      }
                    } catch (err) {
                      throw defs.catchSaveErrors(err)
                    }
                  } else {
                    let y = new constructor(remult, remult.dataProvider)
                    let controllerRef = getControllerRef(
                      y,
                      remult,
                    ) as controllerRefImpl
                    await controllerRef._updateEntityBasedOnApi(d.fields)
                    if (!remult.isAllowedForInstance(y, allowed))
                      throw new ForbiddenError()

                    await controllerRef.__validateEntity()
                    try {
                      r = {
                        result: await originalMethod.apply(y, d.args),
                        fields: await controllerRef.toApiJson(),
                      }
                    } catch (err) {
                      throw controllerRef.catchSaveErrors(err)
                    }
                  }
                })
                res.success(r)
              } catch (err) {
                if (err.isForbiddenError)
                  // got a problem in next with instance of ForbiddenError  - so replaced it with this bool
                  res.forbidden()
                else res.error(err)
              }
            },
          )
        }
      },
      doWork: async function (
        args: any[],
        self: any,
        baseUrl?: string,
        http?: RestDataProviderHttpProvider,
      ): Promise<any> {
        args = prepareArgsToSend(types, args)

        if (allEntities.includes(target.constructor)) {
          let defs = getEntityRef(self) as rowHelperImplementation<any>
          await defs.__validateEntity()
          let classOptions = x.classes.get(self.constructor)
          if (!classOptions.key) {
            classOptions.key = defs.repository.metadata.key + '_methods'
          }
          try {
            let r = await new (class extends Action<
              serverMethodInArgs,
              serverMethodOutArgs
            > {
              protected execute: (
                info: serverMethodInArgs,
                req: Remult,
                res: DataApiResponse,
              ) => Promise<serverMethodOutArgs>
            })(
              classOptions.key +
                '/' +
                (options?.apiPrefix ? options.apiPrefix + '/' : '') +
                key,
              options ? options.queue : false,
              options.allowed,
            ).run(
              {
                args,
                rowInfo: {
                  data: await defs.toApiJson(),
                  isNewRow: defs.isNew(),
                  wasChanged: defs.wasChanged(),
                  id: defs.getOriginalId(),
                },
              },
              baseUrl,
              http,
            )
            await defs._updateEntityBasedOnApi(r.rowInfo.data)
            return r.result
          } catch (err) {
            throw defs.catchSaveErrors(err)
          }
        } else {
          let defs = getControllerRef(self, undefined) as controllerRefImpl
          try {
            await defs.__validateEntity()
            let r = await new (class extends Action<
              serverMethodInArgs,
              serverMethodOutArgs
            > {
              protected execute: (
                info: serverMethodInArgs,
                req: Remult,
                res: DataApiResponse,
              ) => Promise<serverMethodOutArgs>
            })(
              x.classes.get(self.constructor).key +
                '/' +
                (options?.apiPrefix ? options.apiPrefix + '/' : '') +
                key,
              options ? options.queue : false,
              options.allowed,
            ).run(
              {
                args,
                fields: await defs.toApiJson(),
              },
              baseUrl,
              http,
            )
            await defs._updateEntityBasedOnApi(r.fields)
            return r.result
          } catch (e) {
            throw defs.catchSaveErrors(e)
          }
        }
      },
    }

    result = async function (...args: any[]) {
      if (!isBackend()) {
        let self = this
        return serverAction.doWork(args, self)
      } else return await originalMethod.apply(this, args)
    }
    registerAction(target.constructor, result)
    result[serverActionField] = serverAction

    if (descriptor) {
      descriptor.value = result
      return descriptor
    } else return result
  }
}

const customUndefined = {
  _isUndefined: true,
}
function registerAction(target: any, resultMethod: any) {
  ;(
    target[classBackendMethodsArray] || (target[classBackendMethodsArray] = [])
  ).push(resultMethod)
  actionInfo.allActions.push(resultMethod)
}

function isCustomUndefined(x: any) {
  return x && x._isUndefined
}

export interface jobWasQueuedResult {
  queuedJobId?: string
}
export interface queuedJobInfoResponse {
  done: boolean
  result?: any
  error?: any
  progress?: number
}
export class ProgressListener {
  constructor(private res: DataApiResponse) {}
  progress(progress: number) {
    this.res.progress(progress)
  }
}
export function prepareArgsToSend(types: any[], args: any[]) {
  if (types) {
    for (let index = 0; index < types.length; index++) {
      const paramType = types[index]
      for (const type of [Remult, SqlDatabase]) {
        if (args[index] instanceof type) args[index] = undefined
        else if (paramType == type) {
          args[index] = undefined
        }
      }
      if (args[index] != undefined) {
        let x: FieldOptions = { valueType: paramType }
        x = decorateColumnSettings(x, new Remult())
        if (x.valueConverter) args[index] = x.valueConverter.toJson(args[index])
        let eo = getEntitySettings(paramType, false)
        if (eo != null) {
          let rh = getEntityRef(args[index])
          args[index] = rh.getId()
        }
      }
    }
  }
  return args.map((x) => (x !== undefined ? x : customUndefined))
}
export async function prepareReceivedArgs(
  types: any[],
  args: any[],
  remult: Remult,
  ds: DataProvider,
  res: DataApiResponse,
) {
  for (let index = 0; index < args.length; index++) {
    const element = args[index]
    if (isCustomUndefined(element)) args[index] = undefined
  }

  if (types)
    for (let i = 0; i < types.length; i++) {
      if (args.length < i) {
        args.push(undefined)
      }
      if (types[i] == Remult || types[i] == Remult) {
        args[i] = remult
      } else if (types[i] == SqlDatabase && ds) {
        args[i] = ds
      } else if (types[i] == ProgressListener) {
        args[i] = new ProgressListener(res)
      } else {
        let x: FieldOptions = { valueType: types[i] }
        x = decorateColumnSettings(x, remult)
        if (x.valueConverter) args[i] = x.valueConverter.fromJson(args[i])
        let eo = getEntitySettings(types[i], false)
        if (eo != null) {
          if (!(args[i] === null || args[i] === undefined))
            args[i] = await remult.repo(types[i]).findId(args[i])
        }
      }
    }
  return args
}

export const classBackendMethodsArray = Symbol('classBackendMethodsArray')

export interface ActionInterface {
  doWork: (
    args: any[],
    self: any,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ) => Promise<any>
  __register(
    reg: (
      url: string,
      queue: boolean,
      allowed: AllowedForInstance<any>,
      what: (data: any, req: Remult, res: DataApiResponse) => void,
    ) => void,
  )
}
