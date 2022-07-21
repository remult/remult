import fastify from 'fastify';
import { GenericRequestHandler, GenericResponse, GenericRouter, remultMiddlewareBase, SpecificRoute } from '../../../../core/server/expressBridge';
import { RouteHandlerMethod } from 'fastify/types/route';
import { Task } from "./Task";

const server = fastify();

function fastifyHandler(handler: GenericRequestHandler) {
    const response: RouteHandlerMethod = (req, res) => {
        const myRes: GenericResponse = {
            status(statusCode) {
                res.status(statusCode);
                return myRes;
            },
            end() {
                res.send();
            },
            json(data) {
                res.send(data);
            }
        };
        handler(req, myRes, () => { });
    };
    return response;
}
//@ts-ignore
let fastifyRouter: GenericRouter = {
    route(path) {
        let r = {
            delete(handler) {
                server.delete(path, fastifyHandler(handler));
                return r;
            },
            get(handler) {
                server.get(path, fastifyHandler(handler));
                return r;

            }, post(handler) {
                server.post(path, fastifyHandler(handler));
                return r;

            }, put(handler) {
                server.put(path, fastifyHandler(handler));
                return r;

            },
        } as SpecificRoute;
        return r;
    },
};
if (true)
    remultMiddlewareBase(fastifyRouter, {
        entities: [Task]
    });
else
    server.post('/api/tasks', (req, res) => {
        console.log(req.body);
        res.send({ result: 123 });
    });
const port = 3003;
server.listen({ port }, () => console.log("listening on " + port));
