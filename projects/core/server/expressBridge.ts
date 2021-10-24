

import { DataProvider, Remult, IdEntity } from '../';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';


import { JsonEntityFileStorage } from './JsonEntityFileStorage';
import { JsonDataProvider } from '../src/data-providers/json-data-provider';
import { Field, Entity, Repository, getEntityKey } from '../src/remult3';
import { NumberValueConverter } from '../valueConverters';
import { Action, jobWasQueuedResult, queuedJobInfoResponse } from '../src/server-action';
import { ErrorInfo } from '../src/data-interfaces';
import { DataApi, DataApiRequest, DataApiResponse, serializeError } from '../src/data-api';
import { allEntities, AllowedForInstance } from '../src/context';



export function initExpress(app: express.Express,
  options?:
    {
      dataProvider?: DataProvider,
      bodySizeLimit?: string,
      disableAutoApi?: boolean,
      queueStorage?: QueueStorage
      initRequest?: (remult: Remult, origReq: express.Request) => Promise<void>
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

  if (!options.dataProvider) {
    options.dataProvider = new JsonDataProvider(new JsonEntityFileStorage('./db'));
  }

  let result = new ExpressBridge(app, new inProcessQueueHandler(options.queueStorage), options.initRequest, options.dataProvider);
  let apiArea = result.addArea('/' + Remult.apiBaseUrl);



  if (!options.disableAutoApi) {
    registerActionsOnServer(apiArea);
    registerEntitiesOnServer(apiArea);
  }


  return result;
}


export class ExpressBridge {


  openApiDoc(options: { title: string }) {
    let r = new Remult();
    let spec: any = {
      info: { title: options.title },
      openapi: "3.0.0",
      //swagger: "2.0",
      "components": {
        "securitySchemes": {
          "bearerAuth": {
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "type": "http"
          }
        }
      },
      paths: {
      },
      definitions: {
      }
    };
    let validationError = {
      "400": {
        "description": "Error: Bad Request",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/definitions/InvalidResponse"
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

      if (key) {
        let properties: any = {};
        for (const f of meta.fields) {
          properties[f.key] = {
            "type": f.valueType == String ? "string" :
              f.valueType == Boolean ? "boolean" :
                f.valueType == Date ? "string" :
                  f.valueType == Number ? "number" :
                    "object"
          }
        }
        spec.definitions[key] = {
          type: "object",
          properties
        }
        let definition = {
          "$ref": "#/definitions/" + key
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
          description:"return an array of "+key+". supports filter operators",
          parameters: [{
            "name": "_limit",
            "in": "path",
            "description": "limit the number of returned rows, default 100",
            "required": false,
            "example": "25",
            "type": "int"
          },
          {
            "name": "_page",
            "in": "path",
            "description": "to be used for paging",
            "required": false,
            "type": "int"
          },
          {
            "name": "_sort",
            "in": "path",
            "description": "the columns to sort on",
            "example": "name,id",
            "required": false,
            "type": "string"
          }, 
          {
            "name": "_order ",
            "in": "path",
            "description": "the sort order to user for the columns in `_sort`",
            "example": "desc,asc",
            "required": false,
            "type": "string"
          }],
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
          "type": "string"
        };
        let itemInBody = {
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/definitions/" + key
                }
              }
            }
          }
        };



        apiPath.post = secure(meta.options.allowApiInsert, false, {
          "summary": "insert a " + key,
          "description": "insert a " + key,
          "produces": ["application/json"],

          ...itemInBody,

          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {

                  "schema": {
                    "$ref": "#/definitions/" + key

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
              "description": "returns an item of " + key,
              "content": {
                "application/json": {

                  "schema": {
                    "$ref": "#/definitions/" + key

                  }
                }
              }
            },
          }
        });


        apiPathWithId.put = secure(meta.options.allowApiUpdate, false, {
          "summary": "Update a " + key,
          "description": "Update a " + key,
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
                    "$ref": "#/definitions/" + key

                  }
                }
              }
            },
            ...validationError
          }
        });
        apiPathWithId.delete = secure(meta.options.allowApiDelete, false, {
          "summary": "Delete a " + key,
          "description": "Delete a " + key,
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
    spec.definitions["InvalidResponse"] = {
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
  backendMethodsOpenApi: { path: string, allowed: AllowedForInstance<any> }[] = [];


  constructor(private app: express.Express, public queue: inProcessQueueHandler, public initRequest: (remult: Remult, origReq: express.Request) => Promise<void>,
    public dataProvider: DataProvider) {

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
  async getValidContext(req: express.Request) {
    return this.firstArea.getValidContext(req);
  }


}

export class SiteArea {
  constructor(
    private bridge: ExpressBridge,
    private app: express.Express,
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
  process(what: (remult: Remult, myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res, req);
      let remult = new Remult();
      remult.setDataProvider(this.bridge.dataProvider);
      let user = req['user'];
      if (user)
        remult.setUser(user);
      if (this.bridge.initRequest) {
        await this.bridge.initRequest(remult, req);
      }

      what(remult, myReq, myRes, req);
    }
  };
  async getValidContext(req: express.Request) {
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
    __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) => void
  }) {
    action.__register((url: string, queue: boolean, allowed: AllowedForInstance<any>, what: (data: any, r: Remult, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      this.bridge.backendMethodsOpenApi.push({ path: myUrl, allowed });
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

  constructor(private r: express.Request) {

  }
}
class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  forbidden(): void {
    this.r.sendStatus(403);
  }
  constructor(private r: express.Response, private req: express.Request) {

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

  public error(data: ErrorInfo): void {
    data = serializeError(data);
    console.error({
      message: data.message,
      stack: data.stack?.split('\n'),
      url: this.req.originalUrl ?? this.req.path,
      method: this.req.method
    });
    this.r.status(400).json(data);
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
  @Field()
  userId: string;
  @Field()
  url: string;
  @Field()
  submitTime: Date;
  @Field()
  doneTime: Date;
  @Field()
  result: string;
  @Field()
  done: boolean;
  @Field()
  error: boolean;
  @Field()
  progress: number;
}

