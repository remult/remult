import { DataProvider, EntityDataProvider } from '../data-interfaces.js';
import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting.js";
import { EntityMetadata } from '../remult3/index.js';
export declare class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    rows: any;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    toString(): string;
}
