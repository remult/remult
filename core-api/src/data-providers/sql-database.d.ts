import { EntityDataProvider, DataProvider } from "../data-interfaces";
import { SqlCommand, SqlCommandWithParameters, SqlImplementation, SqlResult } from "../sql-command";
import { CustomSqlFilterBuilderFunction } from "../filter/filter-consumer-bridge-to-sql-request";
import { EntityMetadata, EntityFilter, RepositoryOverloads } from "../remult3";
import { Remult } from "../context";
export declare class SqlDatabase implements DataProvider {
    private sql;
    static getDb(remult?: Remult): SqlDatabase;
    createCommand(): SqlCommand;
    execute(sql: string): Promise<SqlResult>;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any>;
    static filterToRaw<entityType>(repo: RepositoryOverloads<entityType>, condition: EntityFilter<entityType>, sqlCommand?: SqlCommandWithParameters): Promise<string>;
    static LogToConsole: boolean;
    static durationThreshold: number;
    constructor(sql: SqlImplementation);
    private createdEntities;
}
