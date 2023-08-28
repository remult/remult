/// <reference types="node" />
import type { GetServerSideProps, NextApiHandler, NextApiRequest, PreviewData } from 'next';
import type { ParsedUrlQuery } from 'querystring';
import type { RemultServerCore, RemultServerOptions } from './server';
export declare function remultNext(options?: RemultServerOptions<NextApiRequest>): RemultNextServer;
export declare type RemultNextServer = RemultServerCore<NextApiRequest> & NextApiHandler & {
    getServerSideProps<P extends {
        [key: string]: any;
    } = {
        [key: string]: any;
    }, Q extends ParsedUrlQuery = ParsedUrlQuery, D extends PreviewData = PreviewData>(getServerPropsFunction: GetServerSideProps<P, Q, D>): GetServerSideProps<P, Q, D>;
    /** Creates a `next.js` handler with remult defined in the correct context
     * @see
     * https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler
     */
    handle<T>(handler: NextApiHandler<T>): NextApiHandler<T>;
};
export declare function remultNextApp(options?: RemultServerOptions<Request>): RemultNextAppServer;
export declare type RemultNextAppServer = RemultServerCore<Request> & {
    GET: (req: Request) => Promise<Response>;
    PUT: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
    DELETE: (req: Request) => Promise<Response>;
    withRemult<T>(what: () => Promise<T>): Promise<T>;
};
