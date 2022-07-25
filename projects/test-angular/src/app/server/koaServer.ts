import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { remultMiddleware } from '../../../../core/remult-middleware';
import { GenericResponse } from '../../../../core/server/expressBridge';
import { Task } from './Task';


const app = new koa();

const api = remultMiddleware({ entities: [Task] });
app.use(bodyParser());
app.use(async (ctx, next) => {
    const r = await api.handle(ctx.request);
    if (!r)
        return await next();
    else {
        ctx.response.body = r.data;
        if (r.statusCode)
            ctx.response.status = r.statusCode;
    };
});
app.use(async (ctx, next) => {
    if (ctx.path == '/api/test') {
        const remult = await api.getRemult(ctx.request);
        ctx.response.body = { result: await remult.repo(Task).count() };
    }
    else next();
})

const port = 3002;
app.listen(port, () => console.log("koa started on " + port));