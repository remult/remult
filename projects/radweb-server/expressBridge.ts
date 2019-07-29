

import { Entity, DataApi, DataApiResponse, DataApiError, DataApiRequest, DataApiServer, Action, UserInfo, DataProviderFactory, Context } from 'radweb';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
// @ts-ignore: 
import * as secure from 'express-force-https';
import { registerActionsOnServer } from './register-actions-on-server';
import { registerEntitiesOnServer } from './register-entities-on-server';





export class ExpressBridge implements DataApiServer {
  addAllowedHeader(name: string): void {
    this.allowedHeaders.push(name);
  }
  addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest) => void): void {
    this.preProcessRequestAndReturnTrueToAuthorize.push(processAndReturnTrueToAouthorise);
  }
  preProcessRequestAndReturnTrueToAuthorize: ((req: DataApiRequest) => void)[] = [];

  private allowedHeaders: string[] = ["Origin", "X-Requested-With", "Content-Type", "Accept"];

  constructor(private app: express.Express, dataSource: DataProviderFactory, disableHttpForDevOnly?: boolean) {
    app.use(compression());
    if (disableHttpForDevOnly) {
      app.use(secure);
    }
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    let apiArea = this.addArea('/' + Context.apiBaseUrl);

    registerActionsOnServer(apiArea, dataSource);
    registerEntitiesOnServer(apiArea, dataSource);
  }
  addArea(
    rootUrl: string,
    processAndReturnTrueToAouthorise?: (req: DataApiRequest) => Promise<boolean>
  ) {
    return new SiteArea(this, this.app, rootUrl, processAndReturnTrueToAouthorise);
  }

}
export class SiteArea {
  constructor(
    private bridge: ExpressBridge,
    private app: express.Express,
    private rootUrl: string,
    private processAndReturnTrueToAouthorise: (req: DataApiRequest) => Promise<boolean>) {

  }/*
  addSqlDevHelpers(server: SQLServerDataProvider) {

    let r = this.rootUrl + '/sqlHelper/typescript/:tableName';
    console.log(r);
    this.app.route(r).get(
      async (req, res) => {
        let s = await server.getTypeScript(req.params.tableName);
        res.type('text/plain');
        res.send(s);
      });
    r = this.rootUrl + '/sqlHelper/tables';
    console.log(r);
    this.app.route(r).get(
      async (req, res) => {
        server.listOfTables(new ExpressResponseBridgeToDataApiResponse(res), {
          get: key => {
            return req.query[key]
          }, clientIp: '', authInfo: undefined, getHeader: x => "",
        });
      });
  }*/

  add(entityOrDataApiFactory: Entity<any> | ((req: DataApiRequest) => DataApi<any>)) {


    let api: ((req: DataApiRequest) => DataApi<any>);
    if (entityOrDataApiFactory instanceof Entity)
      api = () => new DataApi(entityOrDataApiFactory);
    else api = entityOrDataApiFactory;

    let myRoute = api({ clientIp: 'onServer', user: undefined, get: (r: any) => '', getHeader: (x: any) => "" }).getRoute();
    myRoute = this.rootUrl + '/' + myRoute;
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
      .get(this.process(async (req, res, orig) => api(req).get(res, orig.params.id)))
      .put(this.process(async (req, res, orig) => api(req).put(res, orig.params.id, orig.body)))
      .delete(this.process(async (req, res, orig) => api(req).delete(res, orig.params.id)));


  }
  process(what: (myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res);
      let ok = true;
      for (let i = 0; i < this.bridge.preProcessRequestAndReturnTrueToAuthorize.length; i++) {
        await this.bridge.preProcessRequestAndReturnTrueToAuthorize[i](myReq);

      }
      if (this.processAndReturnTrueToAouthorise)
        if (!await this.processAndReturnTrueToAouthorise(myReq))
          ok = false;

      if (!ok)
        myRes.forbidden();
      else
        what(myReq, myRes, req);
    }
  };
  addAction<T extends Action<any, any>>(action: T) {
    action.__register((url: string, what: (data: any, r: DataApiRequest, res: DataApiResponse) => void) => {
      let myUrl = this.rootUrl + '/' + url;
      console.log(myUrl);
      this.app.route(myUrl).post(this.process(
        async (req, res, orig) =>
          what(orig.body, req, res)
      ));
    });
  }
}
class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
  get(key: string): string {
    return this.r.query[key];
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
    this.r.status(400).json(data);
  }
}
