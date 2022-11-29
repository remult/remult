import { Remult, SqlDatabase, EntityMetadata, SqlCommand, SqlImplementation, SqlResult } from "remult";
import { verifyStructureOfAllEntities } from "remult/postgres/schema-builder";
import { ClientOptions, ConnectionString, Pool } from "https://deno.land/x/postgres@v0.16.1/mod.ts";
import { QueryObjectResult } from "https://deno.land/x/postgres@v0.16.1/query/query.ts";

class PostgresBridgeToSQLCommand implements SqlCommand {
    constructor(private source: {
        queryObject(queryText: string, values?: any[]): Promise<QueryObjectResult>;
    }) {

    }
    values: any[] = [];
    addParameterAndReturnSqlToken(val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    execute(sql: string): Promise<SqlResult> {
        return this.source.queryObject(sql, this.values).then(r => new PostgresBridgeToSQLQueryResult(r));
    }
}
class PostgresBridgeToSQLQueryResult implements SqlResult {
    getColumnKeyInResultForIndexInSelect(index: number): string {

        return this.r.columns![index];
    }

    constructor(public r: QueryObjectResult) {
        this.rows = r.rows;
    }
    rows: any[];

}
export class PostgresDataProvider implements SqlImplementation {
    async entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void> {}
    getLimitSqlSyntax(limit: number, offset: number) {
        return ' limit ' + limit + ' offset ' + offset;
    }

    createCommand(): SqlCommand {
        return new PostgresBridgeToSQLCommand({
            queryObject: async (queryText, values) => {
                const client = await this.pool.connect();
                try {
                    return await client.queryObject(queryText, values);
                }
                finally {
                    await client.end();
                    client.release();
                }
            }
        });
    }
    constructor(private pool: Pool) { }

    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>) {
        let client = await this.pool.connect();
        const transaction = client.createTransaction("trans");


        try {
            await transaction.begin();
            await action({
                createCommand: () => new PostgresBridgeToSQLCommand(transaction),
                entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
                transaction: () => { throw "nested transactions not allowed" },
                getLimitSqlSyntax: this.getLimitSqlSyntax
            });
            await transaction.commit();
        }
        catch (err) {
            await transaction.rollback();
            throw err;
        }
        finally {
            await client.end();
            client.release();
        }
    }
}

export async function createPostgresConnection(options?: {
    connectionString?: string,
    poolSize?: number,
    configuration?: ClientOptions | ConnectionString | undefined,
    autoCreateTables?: boolean
}) {
    if (!options)
        options = {};
    let config: ClientOptions | ConnectionString = {};
    if (options.configuration)
        config = options.configuration;

    if (!options.configuration && options.connectionString) {
        config = options.connectionString;
    }
    if (!options.poolSize)
        options.poolSize = 4;
    const db = new SqlDatabase(new PostgresDataProvider(new Pool(config, options.poolSize)));
    let remult = new Remult();
    remult.setDataProvider(db);
    if (options.autoCreateTables === undefined || options.autoCreateTables)
        await verifyStructureOfAllEntities(db, remult);
    return db;
}