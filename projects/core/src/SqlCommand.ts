import { Column } from './column';

export abstract class SqlDatabase {
    abstract createCommand(): SqlCommand;
}

export interface SqlCommand {
    addParameterAndReturnSqlToken(col: Column<any>, val: any): string;
    execute(sql: string): Promise<SqlResult>;
}

export interface SqlResult {
    rows: any[];
    getColumnIndex(name: string): number;
    getcolumnNameAtIndex(index: number): string;
}