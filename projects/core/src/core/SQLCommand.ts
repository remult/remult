import { Column } from './column';


export interface SQLCommand {
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string;
    query(sql: string): Promise<SQLQueryResult>;
}

export interface SQLConnectionProvider {
    createCommand(): SQLCommand;
}
export interface SQLQueryResult {
    rows: any[];
    getColumnIndex(name: string): number;
    getcolumnNameAtIndex(index: number): string;
}


export interface SupportsDirectSql {
    getDirectSql(): DirectSQL;
}
export abstract class DirectSQL {
    abstract execute(sql: string): Promise<SQLQueryResult>;
}