import type { FastifyPluginCallback } from 'fastify';
import { RemultServer, RemultServerOptions } from './server/expressBridge';
export declare function remultFastify(options: RemultServerOptions): FastifyPluginCallback & RemultServer;
