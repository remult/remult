import { DataProvider, EntityDataProvider } from '../data-interfaces';
import { __RowsOfDataForTesting } from '../__RowsOfDataForTesting';
import { EntityMetadata } from '../remult3';
export declare class InMemoryDataProvider implements DataProvider, __RowsOfDataForTesting {
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    rows: any;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    toString(): string;
}
