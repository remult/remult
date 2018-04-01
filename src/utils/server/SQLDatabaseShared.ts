import { Column } from "../..";
import { FilterConsumer } from "../DataInterfaces";



export interface SQLCommand {
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string;
    query(sql: string): Promise<SQLQueryResult>;
}
export interface SQLQueryResult extends Array<any> {
    columns: SQLColumns;
}
export interface SQLColumns {
    [name: string]: {
        index: number;
        name: string;
        length: number;
    }
}


export interface SQLConnectionProvider {
    createCommand(): SQLCommand;
}

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
    where = "";
    constructor(private r: SQLCommand) { }
    IsEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, "=");
    }
    IsDifferentFrom(col: Column<any>, val: any): void {
        this.add(col, val, "<>");
    }
    IsGreaterOrEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, ">=");
    }
    IsGreaterThan(col: Column<any>, val: any): void {
        this.add(col, val, ">");
    }
    IsLessOrEqualTo(col: Column<any>, val: any): void {
        this.add(col, val, "<=");
    }
    IsLessThan(col: Column<any>, val: any): void {
        this.add(col, val, "<");
    }
    private add(col: Column<any>, val: any, operator: string) {
        if (this.where.length == 0) {

            this.where += ' where ';
        } else this.where += ' and ';
        this.where += col.__getDbName() + ' ' + operator + ' ' + this.r.addParameterToCommandAndReturnParameterName(col, val);

    }





}