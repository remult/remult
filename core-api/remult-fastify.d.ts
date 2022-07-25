import type { FastifyPluginCallback } from 'fastify';
import { RemultServer, RemultMiddlewareOptions } from './server/expressBridge';
export declare function remultFastify(options: RemultMiddlewareOptions): FastifyPluginCallback & RemultServer;
