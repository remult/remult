import type { Plugin } from 'vite';
export type RemultViteOptions = {
    debug?: boolean;
};
export declare function remult(options?: RemultViteOptions): Plugin;
