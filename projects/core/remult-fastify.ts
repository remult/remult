import type { FastifyInstance, FastifyPluginCallback, RouteHandlerMethod } from 'fastify';
import { GenericRequestHandler, GenericResponse, GenericRouter, RemultServer, buildRemultServer, RemultMiddlewareOptions, SpecificRoute } from './server/expressBridge';


export function remultFastify(options: RemultMiddlewareOptions): FastifyPluginCallback & RemultServer {
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

    let api: RemultServer;
    const pluginFunction: FastifyPluginCallback = async (instance: FastifyInstance, options) => {
        //@ts-ignore
        let fastifyRouter: GenericRouter = {
            route(path) {
                let r = {
                    delete(handler) {
                        instance.delete(path, fastifyHandler(handler));
                        return r;
                    },
                    get(handler) {
                        instance.get(path, fastifyHandler(handler));
                        return r;

                    }, post(handler) {
                        instance.post(path, fastifyHandler(handler));
                        return r;

                    }, put(handler) {
                        instance.put(path, fastifyHandler(handler));
                        return r;

                    },
                } as SpecificRoute;
                return r;
            },
        };
        api = buildRemultServer(fastifyRouter, options);
    };
    const getApi = () => {
        if (!api)
            throw "Please call fastify's register before using this method";
        return api;
    };
    return Object.assign(pluginFunction, {
        addArea: x => getApi().addArea(x),
        getRemult: x => getApi().getRemult(x),
        openApiDoc: x => getApi().openApiDoc(x)
    } as RemultServer);
}
