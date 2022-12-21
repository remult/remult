import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { createRemultServer } from '../../core/server/index';
import { Task } from '../shared/Task';


const app = new koa();

const api = createRemultServer({ entities: [Task] });
app.use(bodyParser());
app.use(async (ctx, next) => {
    const r = await api.handle(ctx.request);
    if (r) {
        ctx.response.body = r.data;
        ctx.response.status = r.statusCode;
    } else
        return await next();
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