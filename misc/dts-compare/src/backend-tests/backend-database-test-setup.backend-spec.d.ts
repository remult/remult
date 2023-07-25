import { dbTestWhatSignature } from '../shared-tests/db-tests-setup';
export declare const testKnexPGSqlImpl: (key: string, what: dbTestWhatSignature, focus?: boolean) => void;
export declare const mySqlTest: import("../shared-tests/db-tests-setup").dbTestMethodSignature;
export declare function testPostgresImplementation(key: string, what: dbTestWhatSignature, focus?: boolean): void;
export declare const testMongo: (key: string, what: dbTestWhatSignature, focus?: boolean) => void;
export declare const testMongoNoTrans: (key: string, what: dbTestWhatSignature, focus?: boolean) => void;
import '../shared-tests';
