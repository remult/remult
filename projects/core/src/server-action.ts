import type { packedRowInfo } from './__EntityValueProvider.js'
import { buildRestDataProvider } from './buildRestDataProvider.js'
import type { FieldOptions } from './column-interfaces.js'
import type { AllowedForInstance, ControllerOptions } from './context.js'
import {
  ClassHelper,
  Remult,
  doTransaction,
  isBackend,
  setControllerSettings,
} from './context.js'
import type { DataApiResponse } from './data-api.js'
import type {
  DataProvider,
  RestDataProviderHttpProvider,
} from './data-interfaces.js'
import { SqlDatabase } from './data-providers/sql-database.js'
import { remult } from './remult-proxy.js'
import type {
  controllerRefImpl,
  rowHelperImplementation,
} from './remult3/RepositoryImplementation.js'
import {
  decorateColumnSettings,
  getControllerRef,
} from './remult3/RepositoryImplementation.js'
import { getEntityRef, getEntitySettings } from './remult3/getEntityRef.js'
import { serverActionField } from './server-action-info.js'
import { checkTarget } from './remult3/Fields.js'
import { remultStatic } from './remult-static.js'

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
    if (!http) http = buildRestDataProvider(remult.apiClient.httpClient!)

    let r = await http.post(baseUrl + '/' + this.actionUrl, pIn)
    let p: jobWasQueuedResult = r
    if (p && p.queuedJobId) {
      let progress = remultStatic.actionInfo.startBusyWithProgress()
      try {
        let runningJob!: queuedJobInfoResponse
        await remultStatic.actionInfo.runActionWithoutBlockingUI(async () => {
          while (!runningJob || !runningJob.done) {
            if (runningJob)
              await new Promise((res) =>
                setTimeout(() => {
                  res(undefined)
                }, 200),
              )
            runningJob = await http!.post(
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
  doWork!: (
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
      } catch (err: any) {
        if (err.isForbiddenError)
          // got a problem in next with instance of ForbiddenError  - so replaced it with this bool
          res.forbidden()
        else res.error(err, undefined)
      }
    })
  }
}
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
  }
  isForbiddenError: true = true
}

export class myServerAction extends Action<inArgs, result> {
  constructor(
    name: string,
    private types: () => any[],
    private options: BackendMethodOptions<any>,
    public originalMethod: (args: any[]) => any,
  ) {
    super(name, options.queue ?? false, options.allowed)
  }

  protected async execute(
    info: inArgs,
    remult: Remult,
    res: DataApiResponse,
  ): Promise<result> {
    let result = { data: {} }
    let ds = remult.dataProvider
    await decideTransaction(remult, this.options, async () => {
      if (!remult.isAllowedForInstance(undefined, this.options.allowed))
        throw new ForbiddenError()

      info.args = await prepareReceivedArgs(
        this.types(),
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
  /**
   * Controls whether this `BackendMethod` runs within a database transaction. If set to `true`, the method will either complete entirely or fail without making any partial changes. If set to `false`, the method will not be transactional and may result in partial changes if it fails.
   * @default true
   * @example
   * {allowed: true, transactional: false}
   */
  transactional?: boolean
  /** EXPERIMENTAL: Determines if this method should be queued for later execution */
  queue?: boolean
  /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
  blockUser?: boolean
  paramTypes?: any[] | (() => any[])
}

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
  return function (target: any, context?: any) {
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

/**
 * Decorator indicating that the decorated method runs on the backend.
 * It allows the method to be invoked from the frontend while ensuring that the execution happens on the server side.
 * By default, the method runs within a database transaction, meaning it will either complete entirely or fail without making any partial changes.
 * This behavior can be controlled using the `transactional` option in the `BackendMethodOptions`.
 *
 * For more details, see: [Backend Methods](https://remult.dev/docs/backendMethods.html).
 *
 * @param options - Configuration options for the backend method, including permissions, routing, and transactional behavior.
 *
 * @example
 * ```typescript
 * @BackendMethod({ allowed: true })
 * async someBackendMethod() {
 *   // method logic here
 * }
 * ```
 */
export function BackendMethod<type = unknown>(
  options: BackendMethodOptions<type>,
) {
  return (
    target: any,
    context: ClassMethodDecoratorContextStub<type> | string,
    descriptor?: any,
  ) => {
    const key = typeof context === 'string' ? context : context.name.toString()
    const originalMethod = descriptor ? descriptor.value : target
    let result = originalMethod
    checkTarget(target)
    function getTypes() {
      // removing import 'reflect-metadata' from server-action.ts, so we return an empty array
      var types: any[] = []
      // typeof Reflect.getMetadata == 'function'
      //   ? Reflect.getMetadata('design:paramtypes', target, key)
      //   : []
      if (options.paramTypes)
        types =
          typeof options.paramTypes === 'function'
            ? options.paramTypes()
            : options.paramTypes
      return types
    }
    if (target.prototype !== undefined) {
      // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

      let serverAction = new myServerAction(
        (options?.apiPrefix ? options.apiPrefix + '/' : '') + key,
        () => getTypes(),
        options,
        (args) => originalMethod.apply(undefined, args),
      )
      serverAction.doWork = async (args, self, url, http) => {
        args = prepareArgsToSend(getTypes(), args)
        if (options.blockUser === false) {
          return await remultStatic.actionInfo.runActionWithoutBlockingUI(
            async () => (await serverAction.run({ args }, url, http)).data,
          )
        } else return (await serverAction.run({ args }, url, http)).data
      }

      result = async function (...args: any[]) {
        if (!isBackend()) {
          return await serverAction.doWork(args, undefined)
        } else
          return await originalMethod.apply(
            //@ts-ignore
            this as any,
            args,
          )
      }
      registerAction(target, result)
      result[serverActionField] = serverAction
      if (descriptor) {
        descriptor.value = result
        return descriptor
      } else return result
    }

    let x = remultStatic.classHelpers.get(target.constructor)!
    if (!x) {
      x = new ClassHelper()
      remultStatic.classHelpers.set(target.constructor, x)
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
          let controllerOptions = x.classes.get(constructor)!

          if (!controllerOptions.key) {
            controllerOptions.key = c.repo(constructor).metadata.key
          }

          reg(
            controllerOptions.key +
              '/' +
              (options?.apiPrefix ? options.apiPrefix + '/' : '') +
              key,
            options ? options.queue ?? false : false,
            options.allowed,
            async (d: serverMethodInArgs, req, res) => {
              d.args = d.args.map((x) => (isCustomUndefined(x) ? undefined : x))
              let allowed = options.allowed

              try {
                let remult = req

                let r: serverMethodOutArgs
                await decideTransaction(remult, options, async () => {
                  d.args = await prepareReceivedArgs(
                    getTypes(),
                    d.args,
                    remult,
                    remult.dataProvider,
                    res,
                  )
                  if (remultStatic.allEntities.includes(constructor)) {
                    let repo = remult.repo(constructor)
                    let y: any
                    const rowInfo = d.rowInfo!

                    if (rowInfo.isNewRow) {
                      y = repo.create()
                      let rowHelper = repo.getEntityRef(
                        y,
                      ) as rowHelperImplementation<any>
                      await rowHelper._updateEntityBasedOnApi(rowInfo.data)
                    } else {
                      let rows = await repo.find({
                        where: {
                          ...repo.metadata.idMetadata.getIdFilter(rowInfo.id),
                          $and: [repo.metadata.options.apiPrefilter ?? {}],
                        },
                      })
                      if (rows.length != 1)
                        throw new Error('not found or too many matches')
                      y = rows[0]
                      await (
                        repo.getEntityRef(y) as rowHelperImplementation<any>
                      )._updateEntityBasedOnApi(rowInfo.data)
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
                    let controllerRef = getControllerRef<unknown>(
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
                res.success(r!)
              } catch (err: any) {
                if (err.isForbiddenError)
                  // got a problem in next with instance of ForbiddenError  - so replaced it with this bool
                  res.forbidden()
                else res.error(err, undefined)
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
        args = prepareArgsToSend(getTypes(), args)

        if (remultStatic.allEntities.includes(target.constructor)) {
          let defs = getEntityRef(self) as rowHelperImplementation<any>
          await defs.__validateEntity()
          let classOptions = x.classes.get(self.constructor)!
          if (!classOptions.key) {
            classOptions.key = defs.repository.metadata.key + '_methods'
          }
          try {
            let r = await new (class extends Action<
              serverMethodInArgs,
              serverMethodOutArgs
            > {
              protected execute!: (
                info: serverMethodInArgs,
                req: Remult,
                res: DataApiResponse,
              ) => Promise<serverMethodOutArgs>
            })(
              classOptions.key +
                '/' +
                (options?.apiPrefix ? options.apiPrefix + '/' : '') +
                key,
              options?.queue ?? false,
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
            await defs._updateEntityBasedOnApi(r.rowInfo!.data, true)
            return r.result
          } catch (err) {
            throw defs.catchSaveErrors(err)
          }
        } else {
          let defs = getControllerRef<unknown>(
            self,
            undefined,
          ) as controllerRefImpl
          try {
            await defs.__validateEntity()
            let r = await new (class extends Action<
              serverMethodInArgs,
              serverMethodOutArgs
            > {
              protected execute!: (
                info: serverMethodInArgs,
                req: Remult,
                res: DataApiResponse,
              ) => Promise<serverMethodOutArgs>
            })(
              x.classes.get(self.constructor)!.key +
                '/' +
                (options?.apiPrefix ? options.apiPrefix + '/' : '') +
                key,
              options?.queue ?? false,
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
      //@ts-ignore I specifically referred to the this of the original function - so it'll be sent inside
      let self: any = this
      if (!isBackend()) {
        return serverAction.doWork(args, self)
      } else return await originalMethod.apply(self, args)
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
  remultStatic.actionInfo.allActions.push(resultMethod)
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
        let x: FieldOptions<unknown, unknown> = { valueType: paramType }
        x = decorateColumnSettings(x, new Remult())
        let eo = getEntitySettings(paramType, false)
        if (eo != null) {
          let rh = getEntityRef(args[index])
          args[index] = rh.getId()
        }
        if (x.valueConverter)
          args[index] = x.valueConverter.toJson!(args[index])
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
        let x: FieldOptions<unknown, unknown> = { valueType: types[i] }
        x = decorateColumnSettings(x, remult)
        if (x.valueConverter) args[i] = x.valueConverter.fromJson!(args[i])
        let eo = getEntitySettings(types[i], false)
        if (eo != null) {
          if (!(args[i] === null || args[i] === undefined))
            args[i] = await remult.repo(types[i]).findId(args[i])
        }
      }
    }
  return args
}

export const classBackendMethodsArray = Symbol.for('classBackendMethodsArray')

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
  ): void
}
//
async function decideTransaction<Y>(
  remult: Remult,
  options: BackendMethodOptions<Y>,
  what: (dp: DataProvider) => Promise<void>,
) {
  if (options.transactional === undefined || options.transactional === true)
    return await doTransaction(remult, what)
  else await what(remult.dataProvider)
}
