import { DataProvider, EntityDataProvider, __RowsOfDataForTesting } from "../data-interfaces";
import { SqlCommand, SqlResult, SqlImplementation } from "../SqlCommand";


import { Column } from "../column";
import { Entity } from "../entity";
import { DateTimeColumn } from "../columns/datetime-column";
import { DateColumn } from "../columns/date-column";
import { BoolColumn, NumberColumn } from "../columns/number-column";
import { ValueListColumn } from "../columns/value-list-column";

export class WebSqlDataProvider implements SqlImplementation, __RowsOfDataForTesting {
    rows: {
        [tableName: string]: any;
    };
    /** @internal */
    //@ts-ignore
    db: Database;
    
    constructor(private databaseName: string) {
        //@ts-ignore
        this.db = window.openDatabase(databaseName, '1.0', databaseName, 2 * 1024 * 1024);
    }
     async entityIsUsedForTheFirstTime(entity: Entity<any>) {
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
        await this.createCommand().execute('create table if not exists ' + entity.__getDbName() + ' (' + result + '\r\n)');
    }

    createCommand(): SqlCommand {
        return new WebSqlBridgeToSQLCommand(this.db);
    }
    
    async transaction(action: (dataProvider: SqlImplementation) => Promise<void>): Promise<void> {
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
        } else if (x instanceof ValueListColumn) {
            result += ' integer default 0 not null';
        }
        else
            result += " text default '' not null ";
        return result;
    }

    toString() { return "WebSqlDataProvider" }
}



class WebSqlBridgeToSQLCommand implements SqlCommand {
    //@ts-ignore
    constructor(private source: Database) {
    }
    values: any[] = [];
    addParameterAndReturnSqlToken(col: Column<any>, val: any): string {
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
    getResultJsonNameForIndexInSelect(index: number): string {
        if (this.rows.length == 0) return undefined;
        let i = 0;
        for (let m in this.rows[0]) {
            if (i++==index)
            return m;
        }
        return undefined;
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