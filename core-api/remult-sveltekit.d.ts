import type { RequestEvent, Handle } from '@sveltejs/kit';
import { RemultServerOptions, RemultServerCore } from './server';
export declare function remultSveltekit(options?: RemultServerOptions<RequestEvent>): RemultSveltekitServer;
export declare type RemultSveltekitServer = RemultServerCore<RequestEvent> & Handle;
