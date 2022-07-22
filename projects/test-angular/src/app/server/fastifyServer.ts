import fastify from 'fastify';
import { Task } from "./Task";
import { remultFastify } from '../../../../core/remult-fastify';

    (async () => {
        const server = fastify();
        const api = remultFastify({ entities: [Task] });
        await server.register(api);
        const port = 3003;
        server.listen({ port }, () => console.log("listening on " + port));
    })();