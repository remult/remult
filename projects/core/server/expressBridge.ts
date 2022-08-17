
import { Action, actionInfo, classBackendMethodsArray, jobWasQueuedResult, myServerAction, queuedJobInfoResponse, serverActionField } from '../src/server-action';
import { DataProvider, ErrorInfo } from '../src/data-interfaces';
import { DataApi, DataApiRequest, DataApiResponse, serializeError } from '../src/data-api';
import { allEntities, AllowedForInstance, Remult, UserInfo } from '../src/context';
import { ClassType } from '../classType';
import { Entity, Fields, getEntityKey, Repository } from '../src/remult3';
import { IdEntity } from '../src/id-entity';
import { AsyncLocalStorage } from 'async_hooks';
import { remult, RemultProxy } from '../src/remult-proxy';




export interface RemultServerOptions<RequestType extends GenericRequest> {
  /** Sets a database connection for Remult.
   *
   * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
  */
  dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
  queueStorage?: QueueStorage;
  initRequest?: (remult: Remult, origReq: RequestType) => Promise<void>;
  getUser?: (request: RequestType) => Promise<UserInfo>;
  initApi?: (remult: Remult) => void | Promise<void>;
  logApiEndPoints?: boolean;
  defaultGetLimit?: number;
  entities?: ClassType<any>[];
  controllers?: ClassType<any>[];
  rootPath?: string;
};

export function createRemultServer<RequestType extends GenericRequest = GenericRequest>(
  options?:
    RemultServerOptions<RequestType>,
): RemultServer {

  if (!options) {
    options = {};
  }
  if (options.logApiEndPoints === undefined)
    options.logApiEndPoints = true;
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


  dataProvider = dataProvider.then(async dp => {
    if (dp)
      return dp;
    return new (await import('./JsonEntityFileStorage')).JsonFileDataProvider('./db')
  });
  if (options.initApi) {
    dataProvider = dataProvider.then(async dp => {
      var remult = new Remult(dp);
      await new Promise((res) => {
        remultObjectStorage.run(remult, async () => {
          await options.initApi(remult);
          res({})
        })
      });
      return dp;
    });
  }
  {
    let allControllers: ClassType<any>[] = [];
    if (!options.entities)
      options.entities = [...allEntities];

    if (options.entities)
      allControllers.push(...options.entities);
    if (options.controllers)
      allControllers.push(...options.controllers);
    options.controllers = allControllers;
  }

  if (options.rootPath === undefined)
    options.rootPath = Remult.apiBaseUrl;
  actionInfo.runningOnServer = true;
  let bridge = new RemultServerImplementation(new inProcessQueueHandler(options.queueStorage), options, dataProvider);
  return bridge;

}
export type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;


export interface ServerHandleResponse {
  data?: any;
  statusCode: number;
}
export interface RemultServer {
  getRemult(req: GenericRequest): Promise<Remult>;
  openApiDoc(options: { title: string }): any;
  registerRouter(r: GenericRouter): void;
  handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;

}
export type GenericRouter = {
  route(path: string): SpecificRoute
}
export type SpecificRoute = {
  get(handler: GenericRequestHandler): SpecificRoute,
  put(handler: GenericRequestHandler): SpecificRoute,
  post(handler: GenericRequestHandler): SpecificRoute,
  delete(handler: GenericRequestHandler): SpecificRoute
}
export interface GenericRequest {
  url?: string; //optional for next
  method?: any;
  body?: any;
  query?: any;
  params?: any;
}


export interface GenericResponse {
  json(data: any);
  status(statusCode: number): GenericResponse;//exists for express and next and not in opine(In opine it's setStatus)
  end();
};


const remultObjectStorage = new AsyncLocalStorage<Remult>();
let remultObjectStorageWasSetup = false;



class RemultServerImplementation implements RemultServer {
  constructor(public queue: inProcessQueueHandler, public options: RemultServerOptions<GenericRequest>,
    public dataProvider: DataProvider | Promise<DataProvider>) {
    if (!remultObjectStorageWasSetup) {
      remultObjectStorageWasSetup = true;
      (remult as RemultProxy).remultFactory = () => {
        const r = remultObjectStorage.getStore()
        if (r)
          return r;
        else throw new Error( "remult object was requested outside of a valid context, try running it within initApi or a remult request cycle");
      };
    }

  }
  routeImpl: RouteImplementation;

  handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse> {
    if (!this.routeImpl) {
      this.routeImpl = new RouteImplementation();
      this.registerRouter(this.routeImpl);
    }
    return this.routeImpl.handle(req, gRes);
  }
  registeredRouter = false;
  registerRouter(r: GenericRouter) {
    if (this.registeredRouter)
      throw "Router already registered";
    this.registeredRouter = true;
    {
      for (const c of this.options.controllers) {
        let z = c[classBackendMethodsArray];
        if (z)
          for (const a of z) {
            let x = <myServerAction>a[serverActionField];
            if (!x) {
              throw 'failed to set server action, did you forget the BackendMethod Decorator?';
            }

            this.addAction(x, r);
          }
      }
      if (this.hasQueue)
        this.addAction({
          __register: x => {
            x(Action.apiUrlForJobStatus, false, () => true, async (data: jobWasQueuedResult, req, res) => {
              let job = await this.queue.getJobInfo(data.queuedJobId);
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
        }, r);

    }
    this.options.entities.forEach(e => {
      let key = getEntityKey(e);
      if (key != undefined)
        this.add(key, c => {
          return new DataApi(c.repo(e), c);
        }, r);
    });
  }

  add(key: string, dataApiFactory: ((req: Remult) => DataApi), r: GenericRouter) {

    let myRoute = this.options.rootPath + '/' + key;
    if (this.options.logApiEndPoints)
      console.log("[remult] " + myRoute);


    r.route(myRoute)
      .get(this.process((c, req, res) =>
        dataApiFactory(c).httpGet(res, req)
      )).put(this.process(async (c, req, res, orig) => dataApiFactory(c).put(res, '', orig.body)))
      .delete(this.process(async (c, req, res, orig) => dataApiFactory(c).delete(res, '')))
      .post(this.process(async (c, req, res, orig) =>
        dataApiFactory(c).httpPost(res, req, orig.body)
      ));
    r.route(myRoute + '/:id')
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
      remult.setDataProvider(await this.dataProvider);
      await new Promise(res => {
        remultObjectStorage.run(remult, async () => {
          if (req) {
            let user;
            if (this.options.getUser)
              user = await this.options.getUser(req);
            else {
              user = req['user'];
              if (!user)
                user = req['auth'];
            }
            if (user)
              remult.setUser(user);
          }
          if (this.options.initRequest) {
            await this.options.initRequest(remult, req);
          }

          await what(remult, myReq, myRes, req);
          res({});
        })
      })
    }
  };
  async getRemult(req: GenericRequest) {
    let remult: Remult;
    await this.process(async (c) => {
      remult = c;
    })(req, undefined);
    return remult;
  }
  hasQueue = false;

  addAction(action: {
    __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) => void
  }, r: GenericRouter) {
    action.__register((url: string, queue: boolean, allowed: AllowedForInstance<any>, what: (data: any, r: Remult, res: DataApiResponse) => void) => {
      let myUrl = this.options.rootPath + '/' + url;
      let tag = (() => {
        let split = url.split('/');
        if (split.length == 1)
          return 'Static Backend Methods';
        else
          return split[0];
      })();
      this.backendMethodsOpenApi.push({ path: myUrl, allowed, tag });
      if (this.options.logApiEndPoints)
        console.log("[remult] " + myUrl);
      if (queue) {
        this.hasQueue = true;
        this.queue.mapQueuedAction(myUrl, what);
      }
      r.route(myUrl).post(this.process(
        async (remult, req, res, orig) => {

          if (queue) {
            let r: jobWasQueuedResult = {
              queuedJobId: await this.queue.submitJob(myUrl, remult, orig.body)
            };

            res.success(r);
          } else
            return what(orig.body, remult, res)
        }
      ));
    });
  }
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
    for (const e of this.options.entities) {
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




}


class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
  get(key: string): any {
    return this.r.query[key];
  }

  constructor(private r: GenericRequest) {

  }
}
class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  forbidden(): void {
    this.setStatus(403).end();
  }
  setStatus(status: number) {
    return this.r.status(status);
  }
  constructor(private r: GenericResponse, private req: GenericRequest) {

  }
  progress(progress: number): void {

  }

  public success(data: any): void {
    this.r.json(data);
  }

  public created(data: any): void {
    this.setStatus(201).json(data);
  }
  public deleted() {
    this.setStatus(204).end();
  }

  public notFound(): void {

    this.setStatus(404).end();
  }

  public error(data: ErrorInfo): void {
    data = serializeError(data);
    console.error({
      message: data.message,
      stack: data.stack?.split('\n'),
      url: this.req.url,
      method: this.req.method
    });
    this.setStatus(400).json(data);;
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
class RouteImplementation {
  map = new Map<string, Map<string, GenericRequestHandler>>();
  route(path: string): SpecificRoute {
    //consider using:
    //* https://raw.githubusercontent.com/cmorten/opine/main/src/utils/pathToRegex.ts
    //* https://github.com/pillarjs/path-to-regexp
    let r = path.toLowerCase();
    let m = new Map<string, GenericRequestHandler>();
    this.map.set(r, m);
    const route = {
      get: (h: GenericRequestHandler) => {
        m.set("get", h);
        return route;
      },
      put: (h: GenericRequestHandler) => {
        m.set("put", h);
        return route;
      },
      post: (h: GenericRequestHandler) => {
        m.set("post", h);
        return route;
      },
      delete: (h: GenericRequestHandler) => {
        m.set("delete", h);
        return route;
      }
    }
    return route;

  }
  async handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined> {


    return new Promise<ServerHandleResponse | undefined>(res => {
      const response = new class implements GenericResponse {
        statusCode = 200;
        json(data: any) {
          if (gRes !== undefined)
            gRes.json(data);
          res({ statusCode: this.statusCode, data });
        }
        status(statusCode: number): GenericResponse {
          if (gRes !== undefined)
            gRes.status(statusCode);
          this.statusCode = statusCode;
          return this;
        }
        end() {
          if (gRes !== undefined)
            gRes.end();
          res({
            statusCode: this.statusCode
          })
        }
      };
      this.middleware(req, response, () => res(undefined));
    })

  }
  middleware(req: GenericRequest, res: GenericResponse, next: VoidFunction) {
    let theUrl: string = req.url;
    if (theUrl.startsWith('/'))//next sends a partial url '/api/tasks' and not the full url
      theUrl = 'http://stam' + theUrl;
    const url = new URL(theUrl);
    const path = url.pathname;
    if (!req.query) {
      let query: { [key: string]: undefined | string | string[] } = {};
      url.searchParams.forEach((val, key) => {
        let current = query[key];
        if (!current) {
          query[key] = val;
          return;
        }
        if (Array.isArray(current)) {
          current.push(val);
          return;
        }
        query[key] = [current, val];
      });
      req.query = query;
    }
    let lowerPath = path.toLowerCase();
    let m = this.map.get(lowerPath);

    if (m) {
      let h = m.get(req.method.toLowerCase());
      if (h) {
        h(req, res, next);
        return;
      }
    }
    let idPosition = path.lastIndexOf('/');
    if (idPosition >= 0) {
      lowerPath = path.substring(0, idPosition) + '/:id';
      m = this.map.get(lowerPath);
      if (m) {
        let h = m.get(req.method.toLowerCase());
        if (h) {
          if (!req.params)
            req.params = {};
          req.params.id = path.substring(idPosition + 1);
          h(req, res, next);
          return;
        }
      }
    }
    next();
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