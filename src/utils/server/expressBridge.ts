import { SQLServerDataProvider } from './SQLServerDataProvider';
import { DataApi, DataApiResponse, DataApiError, DataApiSettings } from './DataApi';
import { Entity } from './../utils';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Action } from './../restDataProvider';
import { DataApiRequest, DataApiServer } from '../DataInterfaces';

export class ExpressBridge<AuthInfoType> implements DataApiServer<AuthInfoType> {
  addAllowedHeader(name: string): void {
    this.allowedHeaders.push(name);
  }
  addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest<AuthInfoType>) => void): void {
    this.preProcessRequestAndReturnTrueToAuthorize.push(processAndReturnTrueToAouthorise);
  }
  preProcessRequestAndReturnTrueToAuthorize: ((req: DataApiRequest<AuthInfoType>) => void)[] = [];

  private allowedHeaders: string[] = ["Origin", "X-Requested-With", "Content-Type", "Accept"];

  constructor(private app: express.Express) {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use((req, res, next) => {

      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Origin", req.header('origin'));
      res.header("Access-Control-Allow-Headers", this.allowedHeaders.join(','));
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");

      next();
    });
  }
  addArea(
    rootUrl: string,
    processAndReturnTrueToAouthorise?: (req: DataApiRequest<AuthInfoType>) => Promise<boolean>
  ) {
    return new SiteArea<AuthInfoType>(this, this.app, rootUrl, processAndReturnTrueToAouthorise);
  }

}
export class SiteArea<AuthInfoType> {
  constructor(
    private bridge: ExpressBridge<AuthInfoType>,
    private app: express.Express,
    private rootUrl: string,
    private processAndReturnTrueToAouthorise: (req: DataApiRequest<AuthInfoType>) => Promise<boolean>) {

  }
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
  }

  add(entityOrDataApiFactory: Entity<any> | ((req: DataApiRequest<AuthInfoType>) => DataApi<any>)) {


    let api: ((req: DataApiRequest<AuthInfoType>) => DataApi<any>);
    if (entityOrDataApiFactory instanceof Entity)
      api = () => new DataApi(entityOrDataApiFactory);
    else api = entityOrDataApiFactory;

    let myRoute = api({ clientIp: 'onServer', authInfo: undefined, get: r => '', getHeader: x => "" }).getRoute();
    myRoute = this.rootUrl + '/' + myRoute;
    console.log(myRoute);


    this.app.route(myRoute)
      .get(this.process((req, res) => api(req).getArray(res, req)))
      .post(this.process(async (req, res, orig) => api(req).post(res, orig.body)));
    this.app.route(myRoute + '/:id')
      .get(this.process(async (req, res, orig) => api(req).get(res, orig.params.id)))
      .put(this.process(async (req, res, orig) => api(req).put(res, orig.params.id, orig.body)))
      .delete(this.process(async (req, res, orig) => api(req).delete(res, orig.params.id)));


  }
  process(what: (myReq: DataApiRequest<AuthInfoType>, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiRequest<AuthInfoType>(req);
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
  addAction<T extends Action<any, any,AuthInfoType>>(action: T) {
    action.__register((url, what: (data: any, r: DataApiRequest<AuthInfoType>, res: DataApiResponse) => void) => {
      console.log('/' + url);
      this.app.route('/' + url).post(this.process(
        async (req, res, orig) =>
          what(orig.body, req, res)
      ));
    });
  }
}
class ExpressRequestBridgeToDataApiRequest<AuthInfoType> implements DataApiRequest<AuthInfoType> {
  get(key: string): string {
    return this.r.query[key];
  }
  getHeader(key: string) { return this.r.headers[key] as string };
  authInfo: AuthInfoType = undefined;
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
    console.log(data);
    if (data instanceof TypeError) {
      data = { message: data.message + '\n' + data.stack };
    }
    let x = JSON.parse(JSON.stringify(data));
    if (!x.message && !x.modelState)
      data = { message: data.message };
    this.r.status(400).json(data);
  }
}
