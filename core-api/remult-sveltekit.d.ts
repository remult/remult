import type { RequestEvent, Handle } from '@sveltejs/kit';
import { RemultServer, RemultServerOptions } from './server';
export declare function remultSveltekit(options?: RemultServerOptions<RequestEvent>): RemultServer<RequestEvent> & Handle;
