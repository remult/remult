import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { RemultServerCore, RemultServerOptions } from './server';
export declare function remultSveltekit(options?: RemultServerOptions<RequestEvent>): RemultSveltekitServer;
export type RemultSveltekitServer = RemultServerCore<RequestEvent> & Handle;
