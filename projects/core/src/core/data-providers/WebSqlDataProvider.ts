import { DataProvider, EntityDataProvider, __RowsOfDataForTesting } from "../data-interfaces";
import { SQLCommand , SQLConnectionProvider, SQLQueryResult } from "../SQLCommand";

import { ActualSQLServerDataProvider } from "./SQLDatabaseShared";
import { Column } from "../column";
import { Entity } from "../entity";
import { DateTimeColumn } from "../columns/datetime-column";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { ClosedListColumn } from "../columns/closed-list-column";

export class WebSqlDataProvider implements DataProvider, __RowsOfDataForTesting {
    rows: {
        [tableName: string]: any;
    };
    /** @internal */
    //@ts-ignore
    db: Database;
    private createdEntities: string[] = [];
    constructor(private databaseName: string) {
        //@ts-ignore
        this.db = window.openDatabase(databaseName, '1.0', databaseName, 2 * 1024 * 1024);
    }
    getEntityDataProvider(entity: Entity<any>): EntityDataProvider {
        if (this.createdEntities.indexOf(entity.__getDbName()) < 0) {

            let result = '';
            entity.__iterateColumns().forEach(x => {
                if (!x.__dbReadOnly()) {
                    if (result.length != 0)
                        result += ',';
                    result += '\r\n  ';
                    result += this.addColumnSqlSyntax(x);
                    if (x == entity.__idColumn)
                        result += ' primary key';
                }
            });
            this.db.transaction(t => t.executeSql('create table if not exists ' + entity.__getDbName() + ' (' + result + '\r\n)'));
        }
        return new ActualSQLServerDataProvider(entity, new WebSqlBridgeToSQLConnection(this.db));
    }
    async transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void> {
        throw new Error("Method not implemented.");
      }

    private addColumnSqlSyntax(x: Column<any>) {
        let result = x.__getDbName();
        if (x instanceof DateTimeColumn)
            result += " integer";
        else if (x instanceof DateColumn)
            result += " integer";
        else if (x instanceof BoolColumn)
            result += " integer default 0 not null";
        else if (x instanceof NumberColumn) {
            if (x.__numOfDecimalDigits == 0)
                result += " integer default 0 not null";
            else
                result += ' real default 0 not null';
        } else if (x instanceof ClosedListColumn) {
            result += ' integer default 0 not null';
        }
        else
            result += " text default '' not null ";
        return result;
    }

    toString() { return "WebSqlDataProvider" }
}

class WebSqlBridgeToSQLConnection implements SQLConnectionProvider {
    //@ts-ignore
    constructor(private source: Database) {
    }
    createCommand(): SQLCommand {
        return new WebSqlBridgeToSQLCommand(this.source);
    }
}

class WebSqlBridgeToSQLCommand implements SQLCommand {
    //@ts-ignore
    constructor(private source: Database) {
    }
    values: any[] = [];
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string {
        this.values.push(val);
        return '~' + this.values.length + '~';
    }
    query(sql: string): Promise<SQLQueryResult> {
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

class WebSqlBridgeToSQLQueryResult implements SQLQueryResult {
    getcolumnNameAtIndex(index: number): string {
        return undefined;
    }
    getColumnIndex(name: string): number {
        if (this.rows.length == 0) return -1;
        let i = 0;
        for (let m in this.rows[0]) {
            if (m == name) return i;
            i++;
        }
        return -1;
    }
    //@ts-ignore
    constructor(private r: SQLResultSet) {
        this.rows = [];
        for (let i = 0; i < r.rows.length; i++) {
            this.rows.push(r.rows.item(i))
        }
    }
    rows: any[];

}