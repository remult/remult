import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { remultMiddleware } from '../../../../core/remult-middleware';
import { GenericResponse } from '../../../../core/server/expressBridge';
import { Task } from './Task';


const app = new koa();

const api = remultMiddleware({ entities: [Task] });
app.use(bodyParser());
app.use(async (ctx, next) => {

    if (await new Promise<boolean>(res => {
        const myRes: GenericResponse = {
            status(statusCode) {
                ctx.response.status = statusCode;
                return myRes;
            },
            json(data) {
                ctx.response.body = data;
                res(false);
            },
            end() {
                res(false);
            },
        };
        api(ctx.request, myRes, () => {
            res(true);
        });
    }))
        await next();

});
app.use(async (ctx, next) => {
    if (ctx.path == '/api/test') {
        const remult = await api.getRemult(ctx.response);
        ctx.response.body = { result: await remult.repo(Task).count() };
        await new Promise((res) => {
            setTimeout(() => {
                res({})
            }, 100);
        });
    }
    else next();
})

const port = 3002;
app.listen(port, () => console.log("koa started on " + port));