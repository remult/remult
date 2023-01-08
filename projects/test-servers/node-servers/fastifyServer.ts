import fastify from 'fastify';
import { Task } from "../shared/Task";
import { remultFastify } from '../../core/remult-fastify';
import { remult } from '../../core/src/remult-proxy';
(async () => {
    const server = fastify();
    const api = remultFastify({ entities: [Task] });
    await server.register(api);
    server.get('/api/test', async (req, res) => {

        return new Promise(async (promiseResolve) => {
            api.withRemult(req, undefined, async () => {
                promiseResolve({ result: await remult.repo(Task).count() });
            });
        });
    })
    const port = 3003;
    server.listen({ port }, () => console.log("listening on " + port));
})();