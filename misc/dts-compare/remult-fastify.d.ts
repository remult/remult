import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import type { RemultServerCore, RemultServerOptions } from './server/expressBridge';
export declare function remultFastify(options: RemultServerOptions<FastifyRequest>): RemultFastifyServer;
export declare type RemultFastifyServer = FastifyPluginCallback & RemultServerCore<FastifyRequest> & {
    withRemult<T>(req: FastifyRequest, what: () => Promise<T>): Promise<T>;
};
