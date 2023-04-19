/// <reference types="node" />
import type { GetServerSideProps, NextApiRequest, PreviewData, NextApiHandler } from "next";
import type { ParsedUrlQuery } from "querystring";
import { RemultServer, RemultServerOptions } from "./server";
export declare function remultNext(options?: RemultServerOptions<NextApiRequest>): RemultServer<NextApiRequest> & NextApiHandler & {
    getServerSideProps<P extends {
        [key: string]: any;
    } = {
        [key: string]: any;
    }, Q extends ParsedUrlQuery = ParsedUrlQuery, D extends PreviewData = PreviewData>(getServerPropsFunction: GetServerSideProps<P, Q, D>): GetServerSideProps<P, Q, D>;
};
