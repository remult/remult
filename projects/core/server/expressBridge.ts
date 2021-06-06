

import { DataApi, DataApiResponse, DataApiError, DataApiRequest, Action, UserInfo, DataProvider, Context, DataProviderFactoryBuilder, ServerContext, jobWasQueuedResult, queuedJobInfoResponse, InMemoryDataProvider, IdEntity, serializeError } from '../';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';


import { JsonEntityFileStorage } from './JsonEntityFileStorage';
import { JsonDataProvider } from '../src/data-providers/json-data-provider';
import { Column, Entity, Repository } from '../src/remult3';
import { DecimalValueConverter } from '../src/columns/loaders';



export function initExpress(app: express.Express,
  options?:
    {
      dataProvider?: DataProvider | DataProviderFactoryBuilder,
      bodySizeLimit?: string,
      disableAutoApi?: boolean,
      queueStorage?: QueueStorage
      getUserFromRequest?: (origReq: express.Request) => Promise<UserInfo>,
      initRequest?: (context: ServerContext) => Promise<void>
    }) {

  if (!options) {
    options = {};
  }
  if (!options.getUserFromRequest) {
    options.getUserFromRequest = x => x['user'];
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
  if (options.dataProvider) {
    let dataProvider = options.dataProvider;
    if (typeof dataProvider === 'function')
      builder = <DataProviderFactoryBuilder>dataProvider;
    else
      builder = () => <DataProvider>dataProvider;
  }
  else {
    builder = () => new JsonDataProvider(new JsonEntityFileStorage('./db'));
  }

  let result = new ExpressBridge(app, options.getUserFromRequest, new inProcessQueueHandler(options.queueStorage), options.initRequest, builder);
  let apiArea = result.addArea('/' + Context.apiBaseUrl);



  if (!options.disableAutoApi) {
    registerActionsOnServer(apiArea);
    registerEntitiesOnServer(apiArea);
  }


  return result;
}


export class ExpressBridge {






  constructor(private app: express.Express, public getUserFromRequest: (origReq: express.Request) => Promise<UserInfo>, public queue: inProcessQueueHandler, public initRequest: (context: ServerContext) => Promise<void>,
    public _dataProviderFactory: DataProviderFactoryBuilder) {

  }
  logApiEndPoints = true;
  private firstArea: SiteArea;

  addArea(
    rootUrl: string,
    isUserValidForArea?: (origReq: DataApiRequest) => boolean
  ) {
    var r = new SiteArea(this, this.app, rootUrl, this.logApiEndPoints, isUserValidForArea);
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
    private logApiEndpoints: boolean,
    private isUserValidForArea: (origReq: DataApiRequest) => boolean) {


  }





  add(entityOrDataApiFactory: ((req: ServerContext) => DataApi)) {


    let api: ((req: ServerContext) => DataApi);
    api = entityOrDataApiFactory;
    let contextForRouteExtraction = new ServerContext();
    contextForRouteExtraction.setReq({ clientIp: 'onServer', user: undefined, get: (r: any) => '', getHeader: (x: any) => "", getBaseUrl: () => '' })
    let myRoute = api(contextForRouteExtraction).getRoute();
    myRoute = this.rootUrl + '/' + myRoute;
    if (this.logApiEndpoints)
      console.log(myRoute);


    this.app.route(myRoute)
      .get(this.process((c, req, res) => {
        if (req.get("__action") == "count") {
          return api(c).count(res, req);
        } else
          return api(c).getArray(res, req);
      })).put(this.process(async (c, req, res, orig) => api(c).put(res, '', orig.body)))
      .delete(this.process(async (c, req, res, orig) => api(c).delete(res, '')))
      .post(this.process(async (c, req, res, orig) => {
        switch (req.get("__action")) {
          case "get":
            return api(c).getArray(res, req, orig.body);
          case "count":
            return api(c).count(res, req, orig.body);
          default:
            return api(c).post(res, orig.body);
        }
      }));
    this.app.route(myRoute + '/:id')
      //@ts-ignore
      .get(this.process(async (c, req, res, orig) => api(c).get(res, orig.params.id)))
      //@ts-ignore
      .put(this.process(async (c, req, res, orig) => api(c).put(res, orig.params.id, orig.body)))
      //@ts-ignore
      .delete(this.process(async (c, req, res, orig) => api(c).delete(res, orig.params.id)));


  }
  process(what: (context: ServerContext, myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res);
      myReq.user = await this.bridge.getUserFromRequest(req);
      if (this.isUserValidForArea)
        if (!this.isUserValidForArea(myReq))
          myReq.user = null;
      let context = new ServerContext();
      context.setReq(myReq);
      context.setDataProvider(this.bridge._dataProviderFactory(context));
      if (this.bridge.initRequest) {
        await this.bridge.initRequest(context);
      }
      what(context, myReq, myRes, req);
    }
  };
  async getValidContext(req: express.Request) {
    let context: ServerContext;
    await this.process(async (c) => {
      context = c;
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
    __register: (reg: (url: string, queue: boolean, what: ((data: any, req: ServerContext, res: DataApiResponse) => void)) => void) => void
  }) {
    action.__register((url: string, queue: boolean, what: (data: any, r: ServerContext, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      if (this.logApiEndpoints)
        console.log(myUrl);
      if (queue) {
        this.initQueue();
        this.bridge.queue.mapQueuedAction(myUrl, what);
      }
      this.app.route(myUrl).post(this.process(
        async (context, req, res, orig) => {

          if (queue) {
            let r: jobWasQueuedResult = {
              queuedJobId: await this.bridge.queue.submitJob(myUrl, context, orig.body)
            };

            res.success(r);
          } else
            return what(orig.body, context, res)
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



function throwError() {
  throw "Invalid";
}
class inProcessQueueHandler {
  constructor(private storage: QueueStorage) {

  }
  async submitJob(url: string, req: ServerContext, body: any): Promise<string> {
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
  mapQueuedAction(url: string, what: (data: any, r: ServerContext, res: ApiActionResponse) => void) {
    this.actions.set(url, what);
  }
  actions = new Map<string, ((data: any, r: ServerContext, res: ApiActionResponse) => void)>();
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
  constructor(private context: Repository<JobsInQueueEntity>) {

  }
  sync: Promise<any> = Promise.resolve();
  doSync<T>(what: () => Promise<T>) {
    return this.sync = this.sync.then(() => what());
  }

  async getJobInfo(queuedJobId: string): Promise<queuedJobInfo> {
    let q = await this.context.findId(queuedJobId);
    let lastProgress: Date = undefined;
    return {
      userId: q.userId,
      info: {
        done: q.done,
        error: q.error ? JSON.parse(q.result) : undefined,
        result: q.done && !q.error ? JSON.parse(q.result) : undefined,
        progress: q.progress
      },
      setErrorResult: async (error: any) => {
        await this.sync;
        q.error = true;
        q.done = true;
        q.result = JSON.stringify(error);
        q.doneTime = new Date();
        q.progress = 1;
        await this.doSync(() => q._.save());
      },
      setResult: async (result: any) => {
        await this.sync;
        q.done = true;
        q.result = JSON.stringify(result);
        q.doneTime = new Date();

        await this.doSync(() => q._.save());

      },
      setProgress: async (progress: number) => {
        if (progress === 0)
          return;
        let now = new Date();
        if (lastProgress && now.valueOf() - lastProgress.valueOf() < 200)
          return;
        lastProgress = new Date();
        await this.sync;
        q.progress = progress;
        await this.doSync(() => q._.save());

      }
    };

  }

  async createJob(url: string, userId: string): Promise<string> {
    let q = this.context.create();
    q.userId = userId;
    q.submitTime = new Date();
    q.url = url;
    await q._.save();
    return q.id;
  }


}


@Entity({
  key: 'jobsInQueue',
  includeInApi: false
})
export class JobsInQueueEntity extends IdEntity {
  @Column()
  userId: string;
  @Column()
  url: string;
  @Column()
  submitTime: Date;
  @Column()
  doneTime: Date;
  @Column()
  result: string;
  @Column()
  done: boolean;
  @Column()
  error: boolean;
  @Column({ valueConverter: () => DecimalValueConverter })
  progress: number;
}

