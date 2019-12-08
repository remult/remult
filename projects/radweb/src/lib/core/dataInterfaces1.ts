
import { FindOptions } from './dataInterfaces1';
import { UserInfo, Allowed, DirectSQL } from '../context/Context';
import { Column } from './column';
import { Entity } from './entity';
import { Sort, SortSegment } from './sort';
import { StringColumn } from './columns/string-column';
import { DropDownSource } from './drop-down-source';




export interface EntityDataProvider {
    count(where: FilterBase): Promise<number>;
    find(options?: FindOptions): Promise<Array<any>>;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export interface FindOptions extends FindOptionsBase {
    orderBy?: Sort;
}

export interface EntityProvider<T extends Entity<any>> {
    find(options?: FindOptionsPerEntity<T>): Promise<T[]>
    count(where?: (entity: T) => FilterBase): Promise<number>;
    create(): T;
}
export interface FindOptionsBase {
    where?: FilterBase;

    limit?: number;
    page?: number;
    additionalUrlParameters?: any;
}
export declare type EntityWhere<rowType extends Entity<any>> = (rowType: rowType) => FilterBase;
export declare type EntityOrderBy<rowType extends Entity<any>> = ((rowType: rowType) => Sort) | ((rowType: rowType) => (Column<any>)) | ((rowType: rowType) => (Column<any> | SortSegment)[]);
export interface FindOptionsPerEntity<rowType extends Entity<any>> {
    where?: EntityWhere<rowType>;
    orderBy?: EntityOrderBy<rowType>;
    limit?: number;
    page?: number;
    additionalUrlParameters?: any;
}

export interface DataProvider {
    getEntityDataProvider(entity: Entity<any>): EntityDataProvider;

}

export interface RowsOfDataForTesting {
    rows: any;
}
export interface SupportsTransaction extends DataProvider {
    doInTransaction(what: (dp: DataProvider) => Promise<void>): Promise<void>;

}
export interface ColumnValueProvider {
    getValue(key: string): any;
    getOriginalValue(key: string): any;
    setValue(key: string, value: any): void;
}
export declare type ColumnOptions<type> = DataColumnSettings<type> | string;
export interface DataColumnSettings<type> {
    jsonName?: string;
    includeInApi?: Allowed;
    caption?: string;
    allowApiUpdate?: Allowed;
    inputType?: string;
    dbName?: string | (() => string);
    value?: type;
    storage?: ColumnStorage<type>;
    onValidate?: () => void | Promise<void>;
    getValue?: (val: type) => any;
    valueChange?: (val: type) => void;
    virtualData?: () => type | Promise<type>;
    dbReadOnly?: boolean;
    display?: (sendDisplay:(to:ColumnDisplay)=>void) => void; 
}

export interface ColumnSetting<rowType> {

    caption?: string;
    readonly?: boolean;
    inputType?: string;
    designMode?: boolean;
    getValue?: (row: rowType) => any;
    hideDataOnInput?: boolean;
    cssClass?: (string | ((row: rowType) => string));
    defaultValue?: (row: rowType) => any;
    onUserChangedValue?: (row: rowType) => void;
    click?: rowEvent<rowType>;
    allowClick?: (row: rowType) => boolean;
    clickIcon?: string;
    dropDown?: DropDownOptions;
    column?: Column<any>;
    width?: string;
  }
  
  
export interface ColumnDisplay {
    dropDown?: DropDownOptions;
    width?: string;
    getValue?: () => any;
    hideDataOnInput?: boolean;
    click?: () => void;
    allowClick?: () => boolean;
    clickIcon?: string;
}
export interface ColumnStorage<dataType> {
    toDb(val: dataType): any;
    fromDb(val: any): dataType;
}
export interface RowEvents {
    rowDeleted?: () => void;
    rowSaved?: (newRow: boolean) => void;
    rowReset?: (newRow: boolean) => void;
}


export interface FilterBase {
    __applyToConsumer(add: FilterConsumer): void;
}
export interface FilterConsumer {
    isEqualTo(col: Column<any>, val: any): void;
    isDifferentFrom(col: Column<any>, val: any): void;
    isGreaterOrEqualTo(col: Column<any>, val: any): void;
    isGreaterThan(col: Column<any>, val: any): void;
    isLessOrEqualTo(col: Column<any>, val: any): void;
    isLessThan(col: Column<any>, val: any): void;
    isContains(col: StringColumn, val: any): void;
    isStartsWith(col: StringColumn, val: any): void;
}

export interface DataApiRequest {
    getBaseUrl(): string;
    get(key: string): any;
    getHeader(key: string): string;
    user: UserInfo;
    clientIp: string;
}
export interface DataApiServer {
    addAllowedHeader(name: string): void;
    addRequestProcessor(processAndReturnTrueToAouthorise: (req: DataApiRequest) => Promise<boolean>): void;

}
export interface SQLCommand {
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string;
    query(sql: string): Promise<SQLQueryResult>;
  }
  export interface SQLQueryResult {
    rows: any[];
    getColumnIndex(name: string): number;
    getcolumnNameAtIndex(index: number): string;
  }
  
  
  
  export interface SQLConnectionProvider {
    createCommand(): SQLCommand;
  }
  export interface SupportsDirectSql {
    getDirectSql(): DirectSQL;
  }
  
  
  


export interface DropDownOptions {

    items?: DropDownItem[] | string[] | any[];
    source?: DropDownSource<any>;
  }
  
  
  export interface DropDownItem {
    id?: any;
    caption?: any;
  }
  
  
  
  
  
  export type rowEvent<T> = (row: T, doInScope: ((what: (() => void)) => void)) => void;
  
  
  export interface FilteredColumnSetting<rowType> extends ColumnSetting<rowType> {
    _showFilter?: boolean;
  }