import { EntityDataProvider, DataProvider } from "../data-interfaces";
import { SqlCommand, SqlImplementation, SqlResult } from "../sql-command";
import { CustomSqlFilterBuilderFunction } from "../filter/filter-consumer-bridge-to-sql-request";
import { EntityMetadata, EntityFilter } from "../remult3";
import { Remult } from "../context";
export declare class SqlDatabase implements DataProvider {
    private sql;
    static getDb(remult?: Remult): SqlDatabase;
    createCommand(): SqlCommand;
    execute(sql: string): Promise<SqlResult>;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    static customFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any>;
    static LogToConsole: boolean;
    static durationThreshold: number;
    constructor(sql: SqlImplementation);
    private createdEntities;
}
