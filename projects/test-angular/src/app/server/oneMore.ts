import express from "express";
import { api } from './server';

function myWithRemult<T>(req: express.Request, what: () => Promise<T>): Promise<T> {
    return new Promise<T>(async (resolve) => {
        api.withRemult(req, undefined!, async () => resolve(await what()));
    });
}
export function oneMore(req: express.Request, res: express.Response, next: VoidFunction);
export function oneMore<T>(req: express.Request, what: () => Promise<T>): Promise<T>;
export function oneMore(req: express.Request, resOrWhat: any, next?: VoidFunction): any {
    if (next === undefined)
        return myWithRemult(req, resOrWhat);

    else
        api.withRemult(req, resOrWhat, next);

}
