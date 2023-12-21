import type { RelationLoaderHelper } from './relation-loader-types';
import type { FindOptions } from './remult3';
export declare class RelationLoader {
    entityLoaders: Map<any, EntityLoader>;
    promises: any[];
    load(rel: RelationLoaderHelper<any>, findOptions: FindOptions<any>): Promise<any[]>;
    constructor();
    resolveAll(): Promise<void>;
}
declare class EntityLoader {
    private rel;
    queries: Map<string, QueryVariation>;
    find(findOptions: FindOptions<any>): Promise<any[]>;
    constructor(rel: RelationLoaderHelper<any>);
}
declare class QueryVariation {
    private rel;
    find(findOptions: FindOptions<any>, where: any): Promise<any[]>;
    constructor(rel: RelationLoaderHelper<any>);
    resolve(): void;
    pendingInStatements: Map<string, PendingInStatements>;
    whereVariations: Map<string, {
        result: Promise<any[]>;
    }>;
}
declare class PendingInStatements {
    private rel;
    private key;
    private options;
    resolve(): void;
    find(where: any): Promise<any[]>;
    values: Map<any, {
        value: any;
        resolve: (value: any[]) => void;
        reject: (error: any) => void;
        result: Promise<any[]>;
    }>;
    constructor(rel: RelationLoaderHelper<any>, key: string, options: FindOptions<any>);
}
export {};
