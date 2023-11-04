import type { __RowsOfDataForTesting } from '../__RowsOfDataForTesting';
import type { DataProvider, EntityDataProvider } from '../data-interfaces';
import type { EntityMetadata } from '../remult3/remult3';
export declare class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    rows: any;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    toString(): string;
}
