import { Remult } from './index';
import type { ClassType } from './classType';
export declare function remultGraphql(options: {
    removeComments?: boolean;
    entities: ClassType<any>[];
    getRemultFromRequest?: (req: any) => Remult;
}): {
    resolvers: {
        Query: Record<string, unknown>;
        Mutation: Record<string, unknown>;
    };
    rootValue: Record<string, any>;
    typeDefs: string;
};
