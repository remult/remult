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
    getResultJsonNameForIndexInSelect(index: number): string;
    //we need this because in postgres the names of the members in the json result are all lowercase and do not match the name and alias in the select
}



