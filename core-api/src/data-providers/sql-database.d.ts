import { EntityDataProvider, DataProvider } from "../data-interfaces.js";
import { SqlCommand, SqlImplementation, SqlResult } from "../sql-command.js";
import { CustomSqlFilterBuilderFunction } from "../filter/filter-consumer-bridge-to-sql-request.js";
import { EntityMetadata, EntityFilter } from "../remult3/index.js";
export declare class SqlDatabase implements DataProvider {
    private sql;
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
