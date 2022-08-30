/// <reference types="websql" />
import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting";
import { SqlCommand, SqlImplementation } from "../sql-command";
import { EntityMetadata } from "../remult3";
import { Remult } from "../context";
export declare class WebSqlDataProvider implements SqlImplementation, __RowsOfDataForTesting {
    private databaseName;
    rows: {
        [tableName: string]: any;
    };
    constructor(databaseName: string, databaseSize?: number);
    static getRawDb(remult?: Remult): Database;
    getLimitSqlSyntax(limit: number, offset: number): string;
    entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>;
    dropTable(entity: EntityMetadata): Promise<void>;
    createTable(entity: EntityMetadata<any>): Promise<void>;
    createCommand(): SqlCommand;
    transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void>;
    private addColumnSqlSyntax;
    toString(): string;
}
