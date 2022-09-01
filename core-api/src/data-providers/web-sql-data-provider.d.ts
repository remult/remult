import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting.js";
import { SqlCommand, SqlImplementation } from "../sql-command.js";
import { EntityMetadata } from "../remult3/index.js";
export declare class WebSqlDataProvider implements SqlImplementation, __RowsOfDataForTesting {
    private databaseName;
    rows: {
        [tableName: string]: any;
    };
    constructor(databaseName: string, databaseSize?: number);
    getLimitSqlSyntax(limit: number, offset: number): string;
    entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>;
    dropTable(entity: EntityMetadata): Promise<void>;
    createTable(entity: EntityMetadata<any>): Promise<void>;
    createCommand(): SqlCommand;
    transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void>;
    private addColumnSqlSyntax;
    toString(): string;
}
