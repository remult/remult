import { ClassType } from "../../classType";
import { Remult } from "../context";
import { DataProvider } from "../data-interfaces";
import { Repository } from "../remult3";
import { CategoriesForTesting } from "../tests/remult-3-entities";
import { Status } from "../tests/testModel/models";
export declare function itWithFocus(key: string, what: () => Promise<void>, focus?: boolean): void;
export declare function testAll(key: string, what: dbTestWhatSignature, focus?: boolean, options?: {
    exclude?: string[];
}): void;
export declare function addDatabaseToTest(tester: dbTestMethodSignature, key?: string): dbTestMethodSignature;
export declare function testInMemory(key: string, what: dbTestWhatSignature, focus?: boolean): void;
export declare const TestDbs: {
    restDataProvider: string;
    mongo: string;
    inMemory: string;
};
export declare type dbTestWhatSignature = ((db: {
    db: DataProvider;
    remult: Remult;
    createEntity<entityType>(entity: ClassType<entityType>): Promise<Repository<entityType>>;
}) => Promise<void>);
export declare type dbTestMethodSignature = ((key: string, what: dbTestWhatSignature, focus: boolean) => void) & {
    key?: string;
};
export declare function testAllDbs<T extends CategoriesForTesting>(key: string, doTest: (helper: {
    remult: Remult;
    createData: (doInsert?: (insert: (id: number, name: string, description?: string, status?: Status) => Promise<void>) => Promise<void>, entity?: {
        new (): CategoriesForTesting;
    }) => Promise<Repository<T>>;
    insertFourRows: () => Promise<Repository<T>>;
}) => Promise<any>, focus?: boolean): Promise<void>;
