

import { Entity, DataApi, DataApiResponse, DataApiError, DataApiRequest, DataApiServer, Action, UserInfo, DataProvider, Context, DataProviderFactoryBuilder } from '@remult/core';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
// @ts-ignore: 
import * as secure from 'express-force-https';
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';
import { isFunction, isString } from 'util';



export function initExpress(app: express.Express, dataProvider: DataProvider | DataProviderFactoryBuilder, disableHttpsForDevOnly?: boolean) {
  app.use(compression());
  if (!disableHttpsForDevOnly) {
    app.use(secure);
  }
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

  let builder: DataProviderFactoryBuilder;
  if (isFunction(dataProvider))
    builder = <DataProviderFactoryBuilder>dataProvider;
  else
    builder = () => <DataProvider>dataProvider;
  let result = new ExpressBridge(app);
  let apiArea = result.addArea('/' + Context.apiBaseUrl);
  registerActionsOnServer(apiArea, builder);
  registerEntitiesOnServer(apiArea, builder);
  return result;
}

export class ExpressBridge implements DataApiServer {
  addAllowedHeader(name: string): void {
    this.allowedHeaders.push(name);
  }
  addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest) => void): void {
    this.preProcessRequestAndReturnTrueToAuthorize.push(processAndReturnTrueToAouthorise);
  }
  preProcessRequestAndReturnTrueToAuthorize: ((req: DataApiRequest) => void)[] = [];

  private allowedHeaders: string[] = ["Origin", "X-Requested-With", "Content-Type", "Accept"];

  constructor(private app: express.Express) {
   
  }
  logApiEndPoints = true;
  addArea(
    rootUrl: string,
    processRequest?: (req: DataApiRequest) => Promise<void>
  ) {
    return new SiteArea(this, this.app, rootUrl, processRequest, this.logApiEndPoints);
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
      .post(this.process(async (req, res, orig) => api(req).post(res, orig.body)));
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
  addAction<T extends Action<any, any>>(action: T) {
    action.__register((url: string, what: (data: any, r: DataApiRequest, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      if (this.logApiEndpoints)
        console.log(myUrl);
      this.app.route(myUrl).post(this.process(
        async (req, res, orig) =>
          what(orig.body, req, res)
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

    if (data instanceof TypeError) {
      data = { message: data.message + '\n' + data.stack };
    }
    let x = JSON.parse(JSON.stringify(data));
    if (!x.message && !x.modelState)
      data = { message: data.message };
    if (isString(x))
      data = { message: x };
    this.r.status(400).json(data);
  }
}
