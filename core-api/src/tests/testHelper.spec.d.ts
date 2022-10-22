import './frontend-database-tests-setup.spec';
import { Remult } from "../context";
import { DataApi } from "../data-api";
import { DataProvider, EntityDataProvider } from "../data-interfaces";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { EntityMetadata } from "../remult3";
export declare function itForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>): void;
export declare function fitForEach<T>(name: string, arrayOfT: T[], runAsync: (item: T) => Promise<any>): void;
export declare function testAsIfOnBackend(what: () => Promise<any>): Promise<void>;
export declare const ActionTestConfig: {
    db: InMemoryDataProvider;
};
export declare function testSql(runAsync: (db: {
    db: DataProvider;
    remult: Remult;
}) => Promise<void>): Promise<void>;
export declare function testInMemoryDb(runAsync: (db: {
    db: DataProvider;
    remult: Remult;
}) => Promise<void>): Promise<void>;
export declare function testRestDb(runAsync: (db: {
    db: DataProvider;
    remult: Remult;
}) => Promise<void>): Promise<void>;
export declare function testAllDataProviders(runAsync: (db: {
    db: DataProvider;
    remult: Remult;
}) => Promise<void>): Promise<void>;
export declare class MockRestDataProvider implements DataProvider {
    private remult;
    constructor(remult: Remult);
    getEntityDataProvider(metadata: EntityMetadata<any>): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    supportsCustomFilter: boolean;
}
export declare function createMockHttpDataProvider(dataApi: DataApi<any>): import("c:/Repos/radweb/projects/core/src/data-interfaces").RestDataProviderHttpProvider;
