import { RemultServerOptions } from './server/expressBridge';
export declare function remultExpress(options?: RemultServerOptions & {
    bodyParser?: boolean;
    bodySizeLimit?: string;
}): import("express-serve-static-core").Router & {
    getRemult: (req: any) => Promise<import(".").Remult>;
    openApiDoc: (options: {
        title: string;
    }) => any;
    addArea: (x: any) => void;
};
