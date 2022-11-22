import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
export declare function remultFastify(options: RemultServerOptions<FastifyRequest>): FastifyPluginCallback & RemultServer;
