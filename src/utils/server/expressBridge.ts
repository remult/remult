import { SQLServerDataProvider } from './SQLServerDataProvider';
import { DataApi, DataApiResponse, DataApiError, DataApiSettings } from './DataApi';
import { Entity } from './../utils';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Action } from './../restDataProvider';
import { DataApiRequest } from 'src/utils/DataInterfaces';

export class ExpressBridge {

  constructor(private app: express.Express, private rootUrl: string = '', private preProcessRequestAndReturnTrueToAuthorize?: (req: DataApiRequest) => boolean) {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(function (req, res, next) {

      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Origin", req.header('origin'));
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");

      next();
    });
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
          }, clientIp: '', context: {}
        });
      });
  }

  add(entityOrDataApiFactory: Entity<any> | ((req: DataApiRequest) => DataApi<any>)) {


    let api: ((req: DataApiRequest) => DataApi<any>);
    if (entityOrDataApiFactory instanceof Entity)
      api = () => new DataApi(entityOrDataApiFactory);
    else api = entityOrDataApiFactory;

    let myRoute = api({ clientIp: 'onServer', context: {}, get: r => '' }).getRoute();
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
   process(what: (myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>) {
    return async (req: express.Request, res: express.Response) => {
      let myReq = new ExpressRequestBridgeToDataApiReqiest(req);
      let myRes = new ExpressResponseBridgeToDataApiResponse(res);
      let ok = true;
      if (this.preProcessRequestAndReturnTrueToAuthorize)
        ok = this.preProcessRequestAndReturnTrueToAuthorize(myReq);
      if (!ok)
        myRes.forbidden();
      else
        what(myReq, myRes,req);
    }
  };
  addAction<T extends Action<any, any>>(action: T) {
    action.__register((url, what: (data: any, r: DataApiRequest) => Promise<any>) => {
      this.app.route('/' + url).post(this.process (async(req, res,orig) => {
        what(orig.body, req).then(y => res.success(y));
      }));
    });
  }
}
class ExpressRequestBridgeToDataApiReqiest implements DataApiRequest {
  get(key: string): string {
    return this.r.query[key];
  }
  context: any = {};
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
