import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { remultMiddleware } from '../../../../core/remult-middleware';
import { GenericResponse } from '../../../../core/server/expressBridge';
import { Task } from './Task';
import * as Router from '@koa/router';

const app = new koa();
const router = new Router();
const api = remultMiddleware({ entities: [Task] });
app.use(bodyParser());
// app.use(async ctx => {

//     await new Promise(res => {
//         const myRes: GenericResponse = {
//             status(statusCode) {
//                 ctx.response.status = statusCode;
//                 return myRes;
//             },
//             json(data) {
//                 ctx.response.body = data;
//                 res({});
//             },
//             end() {
//                 res({});
//             },
//         };
//         api(ctx.request, myRes, () => {
//             res({});
//          });
//     })

// });

router.get('/api/test', async (ctx, res) => {
    return "noam";
    //ctx.respond.body = 
    //const remult = await api.getRemult(req);
    //return { result: await remult.repo(Task).count() }
})
app.use(router.routes());
app.use(router.allowedMethods());
const port = 3002;
app.listen(port, () => console.log("koa started on " + port));