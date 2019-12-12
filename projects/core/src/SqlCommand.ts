import { Column } from './column';
import { Entity } from '..';

export interface SqlImplementation {
    createCommand(): SqlCommand;
    transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>;
    entityIsUsedForTheFirstTime(entity:Entity<any>):Promise<void>;
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



