import { __RowsOfDataForTesting } from "../__RowsOfDataForTesting";
import { SqlCommand, SqlResult, SqlImplementation } from "../sql-command";


import { EntityMetadata, isAutoIncrement } from "../remult3";
import { FieldMetadata } from "../column-interfaces";
import { SqlDatabase } from "./sql-database";
import { getDbNameProvider } from "../filter/filter-consumer-bridge-to-sql-request";
import { Remult } from "../context";
//SqlDatabase.LogToConsole = true;
export class WebSqlDataProvider implements SqlImplementation, __RowsOfDataForTesting {
    rows: {
        [tableName: string]: any;
    };
    /** @internal */
    //@ts-ignore
    db: Database;

    constructor(private databaseName: string, databaseSize = 2 * 1024 * 1024) {

        //@ts-ignore
        this.db = window.openDatabase(databaseName, '1.0', databaseName, databaseSize);
    }
    static getRawDb(remult: Remult) {
        const sql = SqlDatabase.getRawDb(remult);
        const me = sql._getSourceSql() as WebSqlDataProvider;
        if (!me.db) {
            throw "the data provider is not a WebSqlDataProvider";
        }
        return me.db;
    }

    getLimitSqlSyntax(limit: number, offset: number) {
        return ' limit ' + limit + ' offset ' + offset;
    }
    async entityIsUsedForTheFirstTime(entity: EntityMetadata) {
        await this.createTable(entity);
    }

    async dropTable(entity: EntityMetadata) {
        let e = await getDbNameProvider(entity);
        let sql = 'drop  table if exists ' + e.entityName;
        if (SqlDatabase.LogToConsole)
            console.log(sql);
        await this.createCommand().execute(sql);
    }
    async createTable(entity: EntityMetadata<any>) {
        let result = '';
        let e = await getDbNameProvider(entity);
        for (const x of entity.fields) {
            if (!e.isDbReadonly(x) || isAutoIncrement(x)) {
                if (result.length != 0)
                    result += ',';
                result += '\r\n  ';
                if (isAutoIncrement(x)) {
                    if (x.key != entity.idMetadata.field.key)
                        throw "in web sql, autoincrement is only allowed for primary key"
                    result += e.nameOf(x) + ' integer primary key autoincrement';
                }
                else {
                    result += this.addColumnSqlSyntax(x, e.nameOf(x));
                    if (x.key == entity.idMetadata.field.key) {
                        result += ' primary key';
                    }
                }
            }
        }
        let sql = 'create table if not exists ' + e.entityName + ' (' + result + '\r\n)';
        if (SqlDatabase.LogToConsole)
            console.log(sql);
        await this.createCommand().execute(sql);
    }

    createCommand(): SqlCommand {
        return new WebSqlBridgeToSQLCommand(this.db);
    }

    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private addColumnSqlSyntax(x: FieldMetadata, dbName: string) {
        let result = dbName;
        if (x.valueType == Date)
            result += " integer";
        else if (x.valueType == Boolean)
            result += " integer default 0 not null";
        else if (x.valueType == Number) {
            if (!x.valueConverter.fieldTypeInDb)
                result += ' real default 0 not null';
            else
                result += ' ' + x.valueConverter.fieldTypeInDb + ' default 0 not null';
        }
        else
            result += " text" + (x.allowNull ? " " : " default '' not null ");
        return result;
    }

    toString() { return "WebSqlDataProvider" }
}



class WebSqlBridgeToSQLCommand implements SqlCommand {
    //@ts-ignore
    constructor(private source: Database) {
    }
    values: any[] = [];
    addParameterAndReturnSqlToken(val: any): string {
        this.values.push(val);
        return '~' + this.values.length + '~';
    }
    execute(sql: string): Promise<SqlResult> {
        return new Promise((resolve, reject) =>
            this.source.transaction(t => {
                let s = sql;
                let v: any[] = [];
                var m = s.match(/~\d+~/g);
                if (m != null)
                    m.forEach(mr => {
                        s = s.replace(mr, '?');
                        v.push(this.values[Number.parseInt(mr.substring(1, mr.length - 1)) - 1]);
                    })
                t.executeSql(s, v, (t1, r) => resolve(new WebSqlBridgeToSQLQueryResult(r)),
                    (t2, err) => {
                        reject(err.message);
                        return undefined;
                    });
            }));
    }
}

class WebSqlBridgeToSQLQueryResult implements SqlResult {
    getColumnKeyInResultForIndexInSelect(index: number): string {
        if (this.rows.length == 0) return undefined;
        let i = 0;
        for (let m in this.rows[0]) {
            if (i++ == index)
                return m;
        }
        return undefined;
    }

    //@ts-ignore
    constructor(public r: SQLResultSet) {
        this.rows = [];
        for (let i = 0; i < r.rows.length; i++) {
            this.rows.push(r.rows.item(i))
        }
    }
    rows: any[];

}