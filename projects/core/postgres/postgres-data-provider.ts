import { ServerContext, DataProvider, EntityDataProvider, Entity, Column, SqlDatabase, SqlCommand, SqlResult, allEntities, SqlImplementation, EntityDefs, columnDefs } from '../';
import { JobsInQueueEntity, EntityQueueStorage, ExpressBridge } from '../server';
import { Pool, QueryResult } from 'pg';

import { connect } from 'net';


export interface PostgresPool extends PostgresCommandSource {
    connect(): Promise<PostgresClient>;
}
export interface PostgresClient extends PostgresCommandSource {
    release(): void;
}

export class PostgresDataProvider implements SqlImplementation {
    async entityIsUsedForTheFirstTime(entity: EntityDefs): Promise<void> {

    }
    getLimitSqlSyntax(limit: number, offset: number) {
        return ' limit ' + limit + ' offset ' + offset;
    }

    createCommand(): SqlCommand {
        return new PostgresBridgeToSQLCommand(this.pool);
    }
    constructor(private pool: PostgresPool) {
    }
    async insertAndReturnAutoIncrementId(command: SqlCommand, insertStatementString: string, entity: EntityDefs) {
        let r = await command.execute(insertStatementString);
        r = await this.createCommand().execute("SELECT currval(pg_get_serial_sequence('" + entity.dbName + "','" + entity.columns.idColumn.dbName + "'));");
        return +r.rows[0].currval;
    }
    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>) {
        let client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            await action({
                createCommand: () => new PostgresBridgeToSQLCommand(client),
                entityIsUsedForTheFirstTime: this.entityIsUsedForTheFirstTime,
                transaction: () => { throw "nested transactions not allowed" },
                insertAndReturnAutoIncrementId: this.insertAndReturnAutoIncrementId,
                getLimitSqlSyntax: this.getLimitSqlSyntax
            });
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            await client.release();
        }
    }
}


export interface PostgresCommandSource {
    query(queryText: string, values?: any[]): Promise<QueryResult>;
}

class PostgresBridgeToSQLCommand implements SqlCommand {
    constructor(private source: PostgresCommandSource) {

    }
    values: any[] = [];
    addParameterAndReturnSqlToken(val: any): string {
        this.values.push(val);
        return '$' + this.values.length;
    }
    execute(sql: string): Promise<SqlResult> {
        return this.source.query(sql, this.values).then(r => new PostgresBridgeToSQLQueryResult(r));
    }
}
class PostgresBridgeToSQLQueryResult implements SqlResult {
    getColumnKeyInResultForIndexInSelect(index: number): string {
        return this.r.fields[index].name;
    }

    constructor(public r: QueryResult) {
        this.rows = r.rows;
    }
    rows: any[];

}

export async function verifyStructureOfAllEntities(db: SqlDatabase) {
    return await new PostgresSchemaBuilder(db).verifyStructureOfAllEntities();
}

export class PostgresSchemaBuilder {
    async verifyStructureOfAllEntities() {
        console.log("start verify structure");
        let context = new ServerContext();
        for (const entity of allEntities) {
            let x = context.for(entity);
            try {

                if (x.defs.dbName.toLowerCase().indexOf('from ') < 0) {
                    await this.createIfNotExist(x.defs);
                    await this.verifyAllColumns(x.defs);
                }
            }
            catch (err) {
                console.log("failed verify structore of " + x.defs.dbName + " ", err);
            }
        }
    }
    async createIfNotExist(e: EntityDefs): Promise<void> {
        var c = this.pool.createCommand();
        await c.execute("select 1 from information_Schema.tables where table_name=" + c.addParameterAndReturnSqlToken(e.dbName.toLowerCase()) + this.additionalWhere).then(async r => {

            if (r.rows.length == 0) {
                let result = '';
                for (const x of e.columns._items) {
                    if (!x.dbReadOnly) {
                        if (result.length != 0)
                            result += ',';
                        result += '\r\n  ';
                        //@ts-ignore
                        if (x == e.columns.idColumn && e.__options.dbAutoIncrementId)
                            result += x.dbName + ' serial';
                        else {
                            result += this.addColumnSqlSyntax(x);
                            if (x == e.columns.idColumn)
                                result += ' primary key';
                        }
                    }
                }

                let sql = 'create table ' + e.dbName + ' (' + result + '\r\n)';
                console.log(sql);
                await this.pool.execute(sql);
            }
        });
    }
    private addColumnSqlSyntax(x: columnDefs) {
        let result = x.dbName;
        if (x.dbType) {
            if (x.dataType == Number && x.dbType == "decimal")
                result += " numeric" + (x.allowNull ? "" : " default 0 not null");
            else
                result += " " + x.dbType;
        }
        else if (x.dataType == Date)
            result += " timestamp";
        // else if (x instanceof DateColumn)
        //     result += " date";
        else if (x.dataType == Boolean)
            result += " boolean" + (x.allowNull ? "" : " default false not null");
        else if (x.dataType == Number) {
            result += " int" + (x.allowNull ? "" : " default 0 not null");
        }
        //  else if (x instanceof ValueListColumn) {
        //     if (x.info.isNumeric)
        //         result += " int" + (x.defs.allowNull ? "" : " default 0 not null");
        //     else
        //         result += " varchar" + (x.defs.allowNull ? "" : " default '' not null ");
        // }
        else
            result += " varchar" + (x.allowNull ? "" : " default '' not null ");
        return result;
    }

    async addColumnIfNotExist<T extends EntityDefs>(e: T, c: ((e: T) => columnDefs)) {
        if (c(e).dbReadOnly)
            return;
        try {
            let cmd = this.pool.createCommand();

            if (
                (await cmd.execute(`select 1   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken(e.dbName.toLocaleLowerCase())} and column_name=${cmd.addParameterAndReturnSqlToken(c(e).dbName.toLocaleLowerCase())}` + this.additionalWhere
                )).rows.length == 0) {
                let sql = `alter table ${e.dbName} add column ${this.addColumnSqlSyntax(c(e))}`;
                console.log(sql);
                await this.pool.execute(sql);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async verifyAllColumns<T extends EntityDefs>(e: T) {
        try {
            let cmd = this.pool.createCommand();


            let cols = (await cmd.execute(`select column_name   
        FROM information_schema.columns 
        WHERE table_name=${cmd.addParameterAndReturnSqlToken(e.dbName.toLocaleLowerCase())} ` + this.additionalWhere
            )).rows.map(x => x.column_name);
            for (const col of e.columns._items) {
                if (!col.dbReadOnly)
                    if (!cols.includes(col.dbName.toLocaleLowerCase())) {
                        let sql = `alter table ${e.dbName} add column ${this.addColumnSqlSyntax(col)}`;
                        console.log(sql);
                        await this.pool.execute(sql);
                    }
            }

        }
        catch (err) {
            console.log(err);
        }
    }
    additionalWhere = '';
    constructor(private pool: SqlDatabase, schema?: string) {
        if (schema) {
            this.additionalWhere = ' and table_schema=\'' + schema + '\'';
        }
    }
}

export async function preparePostgresQueueStorage(sql: SqlDatabase) {
    let c = new ServerContext(sql);
    {
        let e = c.for(JobsInQueueEntity);
        await new PostgresSchemaBuilder(sql).createIfNotExist(e.defs);
        await new PostgresSchemaBuilder(sql).verifyAllColumns(e.defs);
    }

    return new EntityQueueStorage(c.for(JobsInQueueEntity));

}