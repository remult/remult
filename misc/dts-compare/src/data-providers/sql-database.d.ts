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
    ensureSchema(entities: EntityMetadata<any>[]): Promise<void>;
    getEntityDataProvider(entity: EntityMetadata): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any>;
    static filterToRaw<entityType>(repo: RepositoryOverloads<entityType>, condition: EntityFilter<entityType>, sqlCommand?: SqlCommandWithParameters): Promise<string>;
    /**
     * `false` _(default)_ - No logging
     *
     * `true` - to log all queries to the console
     *
     * `oneLiner` - to log all queries to the console as one line
     *
     * a `function` - to log all queries to the console as a custom format
     */
    static LogToConsole: boolean | 'oneLiner' | ((duration: number, query: string, args: Record<string, any>) => void);
    /**
     * Threshold in milliseconds for logging queries to the console.
     */
    static durationThreshold: number;
    constructor(sql: SqlImplementation);
    private createdEntities;
}
