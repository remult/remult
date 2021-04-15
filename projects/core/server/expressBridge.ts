

import { Entity, DataApi, DataApiResponse, DataApiError, DataApiRequest, Action, UserInfo, DataProvider, Context, DataProviderFactoryBuilder, ServerContext, jobWasQueuedResult, queuedJobInfoResponse, InMemoryDataProvider, IdEntity, StringColumn, BoolColumn, DateTimeColumn, NumberColumn, SpecificEntityHelper } from '../';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';
import { isBoolean, isFunction, isString } from 'util';

import { JwtSessionService } from '../';



export function initExpress(app: express.Express, dataProvider: DataProvider | DataProviderFactoryBuilder,
  options?:
    {

      bodySizeLimit?: string,
      disableAutoApi?: boolean,
      queueStorage?: QueueStorage,
      tokenProvider?: TokenProvider
    }) {

  if (!options) {
    options = {};
  }
  if (options.bodySizeLimit === undefined) {
    options.bodySizeLimit = '10mb';
  }
  if (!options.queueStorage) {
    options.queueStorage = new InMemoryQueueStorage();
  }


  app.use(bodyParser.json({ limit: options.bodySizeLimit }));
  app.use(bodyParser.urlencoded({ extended: true, limit: options.bodySizeLimit }));

  let builder: DataProviderFactoryBuilder;
  if (isFunction(dataProvider))
    builder = <DataProviderFactoryBuilder>dataProvider;
  else
    builder = () => <DataProvider>dataProvider;
  let result = new ExpressBridge(app, new inProcessQueueHandler(options.queueStorage));
  let apiArea = result.addArea('/' + Context.apiBaseUrl);


  if (!options.disableAutoApi) {
    apiArea.setDataProviderFactory(builder);
    registerActionsOnServer(apiArea, builder);
    registerEntitiesOnServer(apiArea, builder);
  }
  if (options.tokenProvider) {
    let x = new JWTCookieAuthorizationHelper(options.tokenProvider);
    result.addRequestProcessor(async req => {
      let token = req.getHeader(x.authCookieName);
      if (token && token.startsWith('Bearer '))
        token = token.substring(7);
        if (token && token.startsWith('Token '))
        token = token.substring(6);
      if (token) {
        req.user = await x.validateToken(token);

      } else {
        var h = req.getHeader('cookie');
        req.user = await x.authenticateCookie(h);
      }
      return !!req.user;
    });
    JwtSessionService.createTokenOnServer = (user: UserInfo) => x.createSecuredTokenBasedOn(user);
  }



  return result;
}


export class ExpressBridge {

  addRequestProcessor(processAndReturnTrueToAuthorize: (req: DataApiRequest) => void): void {
    this.preProcessRequestAndReturnTrueToAuthorize.push(processAndReturnTrueToAuthorize);
  }
  preProcessRequestAndReturnTrueToAuthorize: ((req: DataApiRequest) => void)[] = [];



  constructor(private app: express.Express, public queue: inProcessQueueHandler) {

  }
  logApiEndPoints = true;
  private firstArea: SiteArea;

  addArea(
    rootUrl: string,
    processRequest?: (req: DataApiRequest) => Promise<void>
  ) {
    var r = new SiteArea(this, this.app, rootUrl, processRequest, this.logApiEndPoints);
    if (!this.firstArea) {
      this.firstArea = r;

    }
    return r;
  }
  async getValidContext(req: express.Request) {
    return this.firstArea.getValidContext(req);
  }


}

export class SiteArea {
  constructor(
    private bridge: ExpressBridge,
    private app: express.Express,
    private rootUrl: string,
    private processAndReturnTrueToAouthorise: (req: DataApiRequest) => Promise<void>,
    private logApiEndpoints: boolean) {


  }

  private _dataProviderFactory: DataProviderFactoryBuilder;
  setDataProviderFactory(dataProvider: DataProviderFactoryBuilder) {
    this._dataProviderFactory = dataProvider;
  }


  add(entityOrDataApiFactory: ((req: DataApiRequest) => DataApi)) {


    let api: ((req: DataApiRequest) => DataApi);
    api = entityOrDataApiFactory;

    let myRoute = api({ clientIp: 'onServer', user: undefined, get: (r: any) => '', getHeader: (x: any) => "", getBaseUrl: () => '' }).getRoute();
    myRoute = this.rootUrl + '/' + myRoute;
    if (this.logApiEndpoints)
      console.log(myRoute);


    this.app.route(myRoute)
      .get(this.process((req, res) => {
        if (req.get("__action") == "count") {
          return api(req).count(res, req);
        } else
          return api(req).getArray(res, req);
      })).put(this.process(async (req, res, orig) => api(req).put(res, '', orig.body)))
      .delete(this.process(async (req, res, orig) => api(req).delete(res, '')))
      .post(this.process(async (req, res, orig) => {
        switch (req.get("__action")) {
          case "get":
            return api(req).getArray(res, req, orig.body);
          case "count":
            return api(req).count(res, req, orig.body);
          default:
            return api(req).post(res, orig.body);
        }
      }));
    this.app.route(myRoute + '/:id')
      //@ts-ignore
      .get(this.process(async (req, res, orig) => api(req).get(res, orig.params.id)))
      //@ts-ignore
      .put(this.process(async (req, res, orig) => api(req).put(res, orig.params.id, orig.body)))
      //@ts-ignore
      .delete(this.process(async (req, res, orig) => api(req).delete(res, orig.params.id)));


  }
  process(what: (myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res);
      for (let i = 0; i < this.bridge.preProcessRequestAndReturnTrueToAuthorize.length; i++) {
        await this.bridge.preProcessRequestAndReturnTrueToAuthorize[i](myReq);

      }
      if (this.processAndReturnTrueToAouthorise)
        await this.processAndReturnTrueToAouthorise(myReq);
      what(myReq, myRes, req);
    }
  };
  async getValidContext(req: express.Request) {
    let context = new ServerContext();
    await this.process(async (req) => {
      context.setReq(req);
      context.setDataProvider(this._dataProviderFactory(context));
    })(req, undefined);
    return context;
  }
  initQueue() {
    this.addAction({
      __register: x => {
        x(Action.apiUrlForJobStatus, false, async (data: jobWasQueuedResult, req, res) => {
          let job = await this.bridge.queue.getJobInfo(data.queuedJobId);
          let userId = undefined;
          if (req.user)
            userId = req.user.id;
          if (job.userId == '')
            job.userId = undefined;
          if (userId != job.userId)
            res.forbidden();
          else
            res.success(job.info);
        });
      }
    });
    this.initQueue = () => { };
  }
  addAction(action: {
    __register: (reg: (url: string, queue: boolean, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) => void
  }) {
    action.__register((url: string, queue: boolean, what: (data: any, r: DataApiRequest, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      if (this.logApiEndpoints)
        console.log(myUrl);
      if (queue) {
        this.initQueue();
        this.bridge.queue.mapQueuedAction(myUrl, what);
      }
      this.app.route(myUrl).post(this.process(
        async (req, res, orig) => {

          if (queue) {
            let r: jobWasQueuedResult = {
              queuedJobId: await this.bridge.queue.submitJob(myUrl, req, orig.body)
            };

            res.success(r);
          } else
            return what(orig.body, req, res)
        }
      ));
    });
  }
}
export class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
  get(key: string): any {
    return this.r.query[key];
  }
  getBaseUrl() {
    if (this.r.originalUrl)
      return this.r.originalUrl
    return this.r.path;
  }
  getHeader(key: string) { return this.r.headers[key] as string };
  user: UserInfo = undefined;
  clientIp: string;
  constructor(private r: express.Request) {
    this.clientIp = r.ip;
  }
}
class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  forbidden(): void {
    this.r.sendStatus(403);
  }
  constructor(private r: express.Response) {

  }
  progress(progress: number): void {

  }

  public success(data: any): void {
    this.r.json(data);
  }
  public methodNotAllowed(): void {
    this.r.sendStatus(405);
  }
  public created(data: any): void {
    this.r.statusCode = 201;
    this.r.json(data);
  }
  public deleted() {
    this.r.sendStatus(204);
  }

  public notFound(): void {

    this.r.sendStatus(404);
  }

  public error(data: DataApiError): void {

    data = serializeError(data);
    this.r.status(400).json(data);
  }
}

function serializeError(data: DataApiError) {
  if (data instanceof TypeError) {
    data = { message: data.message, stack: data.stack };
  }
  let x = JSON.parse(JSON.stringify(data));
  if (!x.message && !x.modelState)
    data = { message: data.message,stack:data.stack };
  if (isString(x))
    data = { message: x };
  return data;
}

function throwError() {
  throw "Invalid";
}
class inProcessQueueHandler {
  constructor(private storage: QueueStorage) {

  }
  async submitJob(url: string, req: DataApiRequest, body: any): Promise<string> {
    let id = await this.storage.createJob(url, req.user ? req.user.id : undefined);
    let job = await this.storage.getJobInfo(id);

    this.actions.get(url)(body, req, {
      error: error => job.setErrorResult(serializeError(error))

      ,
      success: result => job.setResult(result),
      progress: progress => job.setProgress(progress)
    });
    return id;
  }
  mapQueuedAction(url: string, what: (data: any, r: DataApiRequest, res: ApiActionResponse) => void) {
    this.actions.set(url, what);
  }
  actions = new Map<string, ((data: any, r: DataApiRequest, res: ApiActionResponse) => void)>();
  async getJobInfo(queuedJobId: string): Promise<queuedJobInfo> {
    return await this.storage.getJobInfo(queuedJobId);
  }

}
export interface queuedJobInfo {
  info: queuedJobInfoResponse;
  userId: string;
  setErrorResult(error: any): void;
  setResult(result: any): void;
  setProgress(progress: number): void;
}
export interface ApiActionResponse {
  error(error: any): void;
  success(result: any): void;
  progress(progress: number): void;

}
class InMemoryQueueStorage implements QueueStorage {
  async getJobInfo(queuedJobId: string): Promise<queuedJobInfo> {
    return this.jobs.get(queuedJobId);
  }

  async createJob(url: string, userId: string) {
    let id = this.jobs.size.toString();
    this.jobs.set(id, {
      info: {
        done: false
      },
      userId: userId,
      setErrorResult: (error: any) => {
        let job = this.jobs.get(id);
        job.info.done = true;
        job.info.error = error;
      },
      setResult: (result: any) => {
        let job = this.jobs.get(id);
        job.info.done = true;
        job.info.result = result;
      },
      setProgress: (progress: number) => {
        let job = this.jobs.get(id);
        job.info.progress = progress;
      }
    });
    return id;
  }
  private jobs = new Map<string, queuedJobInfo>();

}

interface QueueStorage {
  createJob(url: string, userId: string): Promise<string>;
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>;

}
let test = 0;
export class EntityQueueStorage implements QueueStorage {
  constructor(private context: SpecificEntityHelper<string, JobsInQueueEntity>) {

  }
  sync: Promise<any> = Promise.resolve();
  doSync<T>(what: () => Promise<T>) {
    return this.sync = this.sync.then(() => what());
  }

  async getJobInfo(queuedJobId: string): Promise<queuedJobInfo> {
    let q = await this.context.findId(queuedJobId);
    let lastProgress: Date = undefined;
    return {
      userId: q.userId.value,
      info: {
        done: q.done.value,
        error: q.error.value ? JSON.parse(q.result.value) : undefined,
        result: q.done.value && !q.error.value ? JSON.parse(q.result.value) : undefined,
        progress: q.progress.value
      },
      setErrorResult: async (error: any) => {
        await this.sync;
        q.error.value = true;
        q.done.value = true;
        q.result.value = JSON.stringify(error);
        q.doneTime.value = new Date();
        q.progress.value = 1;
        await this.doSync(() => q.save());
      },
      setResult: async (result: any) => {
        await this.sync;
        q.done.value = true;
        q.result.value = JSON.stringify(result);
        q.doneTime.value = new Date();

        await this.doSync(() => q.save());

      },
      setProgress: async (progress: number) => {
        if (progress === 0)
          return;
        let now = new Date();
        if (lastProgress && now.valueOf() - lastProgress.valueOf() < 200)
          return;
        lastProgress = new Date();
        await this.sync;
        q.progress.value = progress;
        await this.doSync(() => q.save());

      }
    };

  }

  async createJob(url: string, userId: string): Promise<string> {
    let q = this.context.create();
    q.userId.value = userId;
    q.submitTime.value = new Date();
    q.url.value = url;
    await q.save();
    return q.id.value;
  }


}

export class JobsInQueueEntity extends IdEntity {
  userId = new StringColumn();
  url = new StringColumn();
  submitTime = new DateTimeColumn();
  doneTime = new DateTimeColumn();
  result = new StringColumn();
  done = new BoolColumn();
  error = new BoolColumn();
  progress = new NumberColumn({ decimalDigits: 3 });
  constructor() {
    super({
      name: 'jobsInQueue',
      allowApiRead: false
    });
  }
}

class JWTCookieAuthorizationHelper {

  constructor(private provider: TokenProvider, public authCookieName?: string) {
    if (!authCookieName) {
      this.authCookieName = 'authorization';

    }
  }

  async authenticateCookie(cookieHeader: string) {
    if (cookieHeader) {
      for (const iterator of cookieHeader.split(';')) {
        let itemInfo = iterator.split('=');
        if (itemInfo && itemInfo[0].trim() == this.authCookieName) {
          if (this.validateToken)
            return await <UserInfo><any>this.validateToken(itemInfo[1]);
        }
      }
      return undefined;
    }
  }

  createSecuredTokenBasedOn(what: any) {
    return this.provider.createToken(what);
  }



  validateToken: (token: string) => Promise<UserInfo> = async (x) => {
    let result: UserInfo;
    try {
      result = <UserInfo><any>this.provider.verifyToken(x);
    } catch (err) { }

    return result;
  };

}
export interface TokenProvider {
  createToken(info: UserInfo): string;
  verifyToken(token: string): UserInfo | any;
}