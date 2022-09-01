import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import { RemultServer, RemultServerOptions } from './server/expressBridge.js';
export declare function remultFastify(options: RemultServerOptions<FastifyRequest>): FastifyPluginCallback & RemultServer;
