import { DataApi, DataApiResponse, DataApiError } from './DataApi';
import { Entity } from './../utils';
import * as express from 'express';

export class ExpressBridge {

  constructor(private app: express.Express,private rootUrl:string='') {

  }
  add(entity: Entity<any>) {
    let api = new DataApi(entity);
    let myRoute = entity.__getName();
    myRoute = this.rootUrl + '/' + myRoute;
    console.log(myRoute);
    this.app.route(myRoute).get((req, res) => {
      
      api.getArray(new ExpressResponseBridgeToDataApiResponse(res), {
        get: key => { 
          return req.query[key]
        }
      });
    }).post(async (req, res) => {
      api.post(new ExpressResponseBridgeToDataApiResponse(res), req.body);
    });
    this.app.route(myRoute+'/:id').get((req, res) => {
      api.get(new ExpressResponseBridgeToDataApiResponse(res), req.params.id);
    }).put(async (req, res) => {
      api.put(new ExpressResponseBridgeToDataApiResponse(res), req.params.id, req.body);
    }).delete(async (req, res) => {
      api.delete(new ExpressResponseBridgeToDataApiResponse(res), req.params.id);
    });


  }
}
class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  constructor(private r: express.Response) {

  }

  public success(data: any): void {
    this.r.json(data);
  }

  public notFound(): void {
    this.r.sendStatus(404);
  }

  public error(data: DataApiError): void {
    this.r.status(500).json(data);
  }
}
