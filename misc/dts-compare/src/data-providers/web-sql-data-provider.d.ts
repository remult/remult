import type { __RowsOfDataForTesting } from '../__RowsOfDataForTesting';
import type { SqlCommand, SqlImplementation } from '../sql-command';
import type { Remult } from '../context';
import type { EntityMetadata } from '../remult3/remult3';
export declare class WebSqlDataProvider implements SqlImplementation, __RowsOfDataForTesting {
    private databaseName;
    rows: {
        [tableName: string]: any;
    };
    constructor(databaseName: string, databaseSize?: number);
    static getDb(remult?: Remult): any;
    getLimitSqlSyntax(limit: number, offset: number): string;
    entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>;
    ensureSchema(entities: EntityMetadata<any>[]): Promise<void>;
    dropTable(entity: EntityMetadata): Promise<void>;
    createTable(entity: EntityMetadata<any>): Promise<void>;
    createCommand(): SqlCommand;
    transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void>;
    private addColumnSqlSyntax;
    toString(): string;
}
