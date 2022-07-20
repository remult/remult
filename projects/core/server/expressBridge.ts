
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';
import { JsonEntityFileStorage } from './JsonEntityFileStorage';
import { Action, actionInfo, jobWasQueuedResult, queuedJobInfoResponse } from '../src/server-action';
import { DataProvider, ErrorInfo } from '../src/data-interfaces';
import { DataApi, DataApiRequest, DataApiResponse, serializeError } from '../src/data-api';
import { allEntities, AllowedForInstance, Remult } from '../src/context';
import { ClassType } from '../classType';
import { Entity, Fields, getEntityKey, Repository } from '../src/remult3';
import { JsonDataProvider } from '../src/data-providers/json-data-provider';
import { IdEntity } from '../src/id-entity';




export type RemultMiddlewareOptions = {
  /** Sets a database connection for Remult.
   *
   * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
  */
  dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
  disableAutoApi?: boolean;
  queueStorage?: QueueStorage;
  initRequest?: (remult: Remult, origReq: GenericRequest) => Promise<void>;
  initApi?: (remult: Remult) => void | Promise<void>;
  logApiEndPoints?: boolean;
  defaultGetLimit?: number;
  entities?: ClassType<any>[];
  controllers?: ClassType<any>[];
  bodyParser?: boolean;
  rootPath?: string;
};

export function remultMiddlewareBase(
  app: GenericRouter,
  options:
    RemultMiddlewareOptions,
): RemultExpressBridge {

  if (!options) {
    options = {};
  }
  actionInfo.runningOnServer = true;
  if (options.defaultGetLimit) {
    DataApi.defaultGetLimit = options.defaultGetLimit;
  }


  if (!options.queueStorage) {
    options.queueStorage = new InMemoryQueueStorage();
  }


  let dataProvider: Promise<DataProvider>;
  if (typeof options.dataProvider === "function") {
    dataProvider = options.dataProvider();
  } else dataProvider = Promise.resolve(options.dataProvider)


  dataProvider = dataProvider.then(dp => {
    if (dp)
      return dp;
    return new JsonDataProvider(new JsonEntityFileStorage('./db'))

  });
  if (options.initApi) {
    dataProvider = dataProvider.then(async dp => {
      var remult = new Remult(dp);
      await options.initApi(remult);
      return dp;
    });
  }



  let bridge = new ExpressBridge(app, new inProcessQueueHandler(options.queueStorage), options.initRequest, dataProvider);
  if (options.logApiEndPoints !== undefined)
    bridge.logApiEndPoints = options.logApiEndPoints;
  if (options.rootPath === undefined)
    options.rootPath = Remult.apiBaseUrl;
  let apiArea = bridge.addArea(options.rootPath);



  if (!options.disableAutoApi) {
    let actions: ClassType<any>[] = [];
    if (options.entities)
      actions.push(...options.entities);
    if (options.controllers)
      actions.push(...options.controllers);
    registerActionsOnServer(apiArea, actions);
    registerEntitiesOnServer(apiArea, options.entities);
  }

  return Object.assign(app, {
    getRemult: (req) => bridge.getRemult(req),
    openApiDoc: (options: { title: string }) => bridge.openApiDoc(options),
    addArea: x => bridge.addArea(x)
  });
}
export interface RemultExpressBridge extends GenericRequestHandler {
  getRemult(req: GenericRequest): Promise<Remult>;
  openApiDoc(options: { title: string }): any;
  addArea(
    rootUrl: string
  );
}
export interface GenericRequest {
  method: any;
  url:any;
  query?: any;
  body: any;
  params?: any;

}

export interface GenericResponse {
  json(data: any);
  statusCode: number;
  end();
}
export type GenericRouter = GenericRequestHandler & {
  route(path: string): SpecificRoute
}
export type SpecificRoute = {
  get(handler: GenericRequestHandler): SpecificRoute,
  put(handler: GenericRequestHandler): SpecificRoute,
  post(handler: GenericRequestHandler): SpecificRoute,
  delete(handler: GenericRequestHandler): SpecificRoute
}
export type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;


class ExpressBridge {


  openApiDoc(options: { title: string, version?: string }) {
    let r = new Remult();
    if (!options.version)
      options.version = "1.0.0";
    let spec: any = {
      info: { title: options.title, version: options.version },
      openapi: "3.0.0",
      //swagger: "2.0",
      "components": {
        "schemas": {},
        "securitySchemes": {
          "bearerAuth": {
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "type": "http"
          }
        }
      },
      paths: {
      }
    };
    let validationError = {
      "400": {
        "description": "Error: Bad Request",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/InvalidResponse"
            }
          }
        }
      }
    }
    let security = {
      "security": [
        {
          "bearerAuth": []
        }
      ]
    }
    let secureBase = (condition: any, def: boolean, item: any) => {
      if (condition === undefined)
        condition = def;
      if (condition != false) {
        if (condition != true) {

          item = { ...item, ...security }
          item.responses["403"] = { description: "forbidden" };
        }
        return item;
      }
    }
    for (const e of allEntities) {
      let meta = r.repo(e).metadata;
      let key = getEntityKey(e);
      let parameters = [];
      if (key) {
        let properties: any = {};
        for (const f of meta.fields) {
          let type = f.valueType == String ? "string" :
            f.valueType == Boolean ? "boolean" :
              f.valueType == Date ? "string" :
                f.valueType == Number ? "number" :
                  "object";
          properties[f.key] = {
            type
          }
          parameters.push({
            "name": f.key,
            "in": "query",
            "description": "filter equal to " + f.key,
            "required": false,
            "style": "simple",
            type
          });
          parameters.push({
            "name": f.key + "_ne",
            "in": "query",
            "description": "filter not equal to " + f.key,
            "required": false,
            "style": "simple",
            type
          });


        }
        spec.components.schemas[key] = {
          type: "object",
          properties
        }
        let definition = {
          "$ref": "#/components/schemas/" + key
        };
        let secure = (condition: any, def: boolean, item: any) => {
          item.tags = [meta.key];
          if (condition === undefined)
            condition = meta.options.allowApiCrud;
          return secureBase(condition, def, item);
        }


        let apiPath: any = spec.paths['/api/' + key] = {};
        let apiPathWithId: any = spec.paths['/api/' + key + "/{id}"] = {};
        //https://github.com/2fd/open-api.d.ts
        apiPath.get = secure(meta.options.allowApiRead, true, {
          description: "return an array of " + key + ". supports filter operators. For more info on filtering [see this article](https://remult.dev/docs/rest-api.html#filter)",
          parameters: [{
            "name": "_limit",
            "in": "query",
            "description": "limit the number of returned rows, default 100",
            "required": false,
            "style": "simple",
            "schema": { "type": "integer" }
          },
          {
            "name": "_page",
            "in": "query",
            "description": "to be used for paging",
            "required": false,
            "schema": { "type": "integer" }
          },
          {
            "name": "_sort",
            "in": "query",
            "description": "the columns to sort on",
            "required": false,
            "schema": { "type": "string" }
          },
          {
            "name": "_order",
            "in": "query",
            "description": "the sort order to user for the columns in `_sort`",
            "required": false,
            "schema": { "type": "string" }
          }, ...parameters],
          responses: {
            "200": {
              "description": "returns an array of " + key,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": definition
                  }
                }
              }

            },
          }
        });
        let idParameter = {
          "name": "id",
          "in": "path",
          "description": "id of " + key,
          "required": true,
          "schema": { "type": "string" },
        };
        let itemInBody = {
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/" + key
                }
              }
            }
          }
        };



        apiPath.post = secure(meta.options.allowApiInsert, false, {
          //"summary": "insert a " + key,
          //"description": "insert a " + key,
          "produces": ["application/json"],

          ...itemInBody,

          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {

                  "schema": {
                    "$ref": "#/components/schemas/" + key

                  }
                }
              }
            },
            ...validationError
          }
        });
        apiPathWithId.get = secure(meta.options.allowApiRead, true, {
          parameters: [idParameter],
          responses: {
            "200": {
              // "description": "returns an item of " + key,
              "content": {
                "application/json": {

                  "schema": {
                    "$ref": "#/components/schemas/" + key

                  }
                }
              }
            },
          }
        });


        apiPathWithId.put = secure(meta.options.allowApiUpdate, false, {
          //"summary": "Update a " + key,
          //"description": "Update a " + key,
          "produces": ["application/json"],
          "parameters": [
            idParameter

          ],
          ...itemInBody,
          "responses": {
            "200": {
              "description": "successful operation",
              "content": {
                "application/json": {

                  "schema": {
                    "$ref": "#/components/schemas/" + key

                  }
                }
              }
            },
            ...validationError
          }
        });
        apiPathWithId.delete = secure(meta.options.allowApiDelete, false, {
          //      "summary": "Delete a " + key,
          //      "description": "Delete a " + key,
          "produces": ["application/json"],
          "parameters": [
            idParameter

          ],
          "responses": {
            "204": {
              "description": "Deleted"

            },
            ...validationError
          }
        });



      }
    }
    for (const b of this.backendMethodsOpenApi) {
      spec.paths[b.path] = {
        post: secureBase(b.allowed, false, {

          "produces": ["application/json"],
          "tags": [b.tag],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  properties: {
                    "args": {
                      "type": "array",
                      "items": { "type": "string" }
                    }
                  }
                }
              }
            }
          },

          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    properties: {
                      "data": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            },
            ...validationError
          }
        })
      }
    }
    spec.components.schemas["InvalidResponse"] = {
      "type": "object",
      properties: {
        "message": {
          "type": "string"
        },
        "modelState": {
          "type": "object"
        }
      }
    }
    return spec;
  }
  /* internal */
  backendMethodsOpenApi: { path: string, allowed: AllowedForInstance<any>, tag: string }[] = [];


  constructor(private app: GenericRouter, public queue: inProcessQueueHandler, public initRequest: (remult: Remult, origReq: GenericRequest) => Promise<void>,
    public dataProvider: DataProvider | Promise<DataProvider>) {

  }
  logApiEndPoints = true;
  private firstArea: SiteArea;

  addArea(
    rootUrl: string
  ) {
    var r = new SiteArea(this, this.app, rootUrl, this.logApiEndPoints);
    if (!this.firstArea) {
      this.firstArea = r;

    }
    return r;
  }
  async getRemult(req?: GenericRequest) {
    return this.firstArea.getRemult(req);
  }


}

export class SiteArea {
  constructor(
    private bridge: ExpressBridge,
    private app: GenericRouter,
    private rootUrl: string,
    private logApiEndpoints: boolean) {


  }





  add(key: string, dataApiFactory: ((req: Remult) => DataApi)) {

    let myRoute = this.rootUrl + '/' + key;
    if (this.logApiEndpoints)
      console.log(myRoute);


    this.app.route(myRoute)
      .get(this.process((c, req, res) =>
        dataApiFactory(c).httpGet(res, req)
      )).put(this.process(async (c, req, res, orig) => dataApiFactory(c).put(res, '', orig.body)))
      .delete(this.process(async (c, req, res, orig) => dataApiFactory(c).delete(res, '')))
      .post(this.process(async (c, req, res, orig) =>
        dataApiFactory(c).httpPost(res, req, orig.body)
      ));
    this.app.route(myRoute + '/:id')
      //@ts-ignore
      .get(this.process(async (c, req, res, orig) => dataApiFactory(c).get(res, orig.params.id)))
      //@ts-ignore
      .put(this.process(async (c, req, res, orig) => dataApiFactory(c).put(res, orig.params.id, orig.body)))
      //@ts-ignore
      .delete(this.process(async (c, req, res, orig) => dataApiFactory(c).delete(res, orig.params.id)));


  }
  process(what: (remult: Remult, myReq: DataApiRequest, myRes: DataApiResponse, origReq: GenericRequest) => Promise<void>) {
    return async (req: GenericRequest, res: GenericResponse) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res, req);
      let remult = new Remult();
      remult.setDataProvider(await this.bridge.dataProvider);
      if (req) {
        let user = req['user'];
        if (!user)
          user = req['auth'];
        if (user)
          remult.setUser(user);
      }
      if (this.bridge.initRequest) {
        await this.bridge.initRequest(remult, req);
      }

      what(remult, myReq, myRes, req);
    }
  };
  async getRemult(req: GenericRequest) {
    let remult: Remult;
    await this.process(async (c) => {
      remult = c;
    })(req, undefined);
    return remult;
  }
  initQueue() {
    this.addAction({
      __register: x => {
        x(Action.apiUrlForJobStatus, false, () => true, async (data: jobWasQueuedResult, req, res) => {
          let job = await this.bridge.queue.getJobInfo(data.queuedJobId);
          let userId = undefined;
          if (req?.user)
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
    __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) => void
  }) {
    action.__register((url: string, queue: boolean, allowed: AllowedForInstance<any>, what: (data: any, r: Remult, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      let tag = (() => {
        let split = url.split('/');
        if (split.length == 1)
          return 'Static Backend Methods';
        else
          return split[0];
      })();
      this.bridge.backendMethodsOpenApi.push({ path: myUrl, allowed, tag });
      if (this.logApiEndpoints)
        console.log(myUrl);
      if (queue) {
        this.initQueue();
        this.bridge.queue.mapQueuedAction(myUrl, what);
      }
      this.app.route(myUrl).post(this.process(
        async (remult, req, res, orig) => {

          if (queue) {
            let r: jobWasQueuedResult = {
              queuedJobId: await this.bridge.queue.submitJob(myUrl, remult, orig.body)
            };

            res.success(r);
          } else
            return what(orig.body, remult, res)
        }
      ));
    });
  }
}
export class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
  get(key: string): any {
    return this.r.query[key];
  }

  constructor(private r: GenericRequest) {

  }
}
class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  forbidden(): void {
    this.sendStatus(403);
  }
  sendStatus(status: number) {
    this.r.statusCode = status;
    this.r.end();
  }
  constructor(private r: GenericResponse, private req: GenericRequest) {

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
    this.sendStatus(204);
  }

  public notFound(): void {

    this.sendStatus(404);
  }

  public error(data: ErrorInfo): void {
    data = serializeError(data);
    console.error({
      message: data.message,
      stack: data.stack?.split('\n'),
      url: this.req.url,
      method: this.req.method
    });
    this.r.statusCode = 400;
    this.r.json(data);
  }
}



function throwError() {
  throw "Invalid";
}
class inProcessQueueHandler {
  constructor(private storage: QueueStorage) {

  }
  async submitJob(url: string, req: Remult, body: any): Promise<string> {
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
  mapQueuedAction(url: string, what: (data: any, r: Remult, res: ApiActionResponse) => void) {
    this.actions.set(url, what);
  }
  actions = new Map<string, ((data: any, r: Remult, res: ApiActionResponse) => void)>();
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

export interface QueueStorage {
  createJob(url: string, userId: string): Promise<string>;
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>;

}
let test = 0;
export class EntityQueueStorage implements QueueStorage {
  constructor(private repo: Repository<JobsInQueueEntity>) {

  }
  sync: Promise<any> = Promise.resolve();
  doSync<T>(what: () => Promise<T>) {
    return this.sync = this.sync.then(() => what());
  }

  async getJobInfo(queuedJobId: string): Promise<queuedJobInfo> {
    let q = await this.repo.findId(queuedJobId);
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
    let q = this.repo.create();
    q.userId = userId;
    q.submitTime = new Date();
    q.url = url;
    await q._.save();
    return q.id;
  }


}


@Entity(undefined, {
  dbName: 'jobsInQueue'
})
export class JobsInQueueEntity extends IdEntity {
  @Fields.string()
  userId: string;
  @Fields.string()
  url: string;
  @Fields.date()
  submitTime: Date;
  @Fields.date()
  doneTime: Date;
  @Fields.string()
  result: string;
  @Fields.boolean()
  done: boolean;
  @Fields.boolean()
  error: boolean;
  @Fields.number()
  progress: number;
}

allEntities.splice(allEntities.indexOf(JobsInQueueEntity), 1);