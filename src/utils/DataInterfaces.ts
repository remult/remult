import { Column, Entity, Sort, SortSegment } from './utils';
import { FindOptions } from './DataInterfaces';




export interface DataProvider {
  find(options?: FindOptions): Promise<Array<any>>;
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}
export interface FindOptions extends FindOptionsBase {
  orderBy?: Sort;
}
export interface EntitySourceFindOptions extends FindOptionsBase {
  orderBy?: Sort | Column<any> | (Column<any> | SortSegment)[];
}

export interface FindOptionsBase {
  where?: FilterBase;

  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}
export interface FindOptionsPerEntity<rowType extends Entity<any>> {
  where?: (rowType: rowType) => FilterBase;
  orderBy?: ((rowType: rowType) => Sort) | ((rowType: rowType) => (Column<any>)) | ((rowType: rowType) => (Column<any> | SortSegment)[]);
  limit?: number;
  page?: number;
  additionalUrlParameters?: any;
}

export interface DataProviderFactory {
  provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider;
}
export interface ColumnValueProvider {
  getValue(key: string): any;
  setValue(key: string, value: any): void;
}

export interface DataColumnSettings<type, colType> {
  jsonName?: string;
  caption?: string;
  readonly?: boolean;
  inputType?: string;
  dbName?: string;
  value?: type;
  storage?: ColumnStorage<type>;
  onValidate?: (col: colType) => void | Promise<void>;
  getValue?: (val: type) => any;
  valueChange?: (val: type) => void;
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
  IsEqualTo(col: Column<any>, val: any): void;
  IsDifferentFrom(col: Column<any>, val: any): void;
  IsGreaterOrEqualTo(col: Column<any>, val: any): void;
  IsGreaterThan(col: Column<any>, val: any): void;
  IsLessOrEqualTo(col: Column<any>, val: any): void;
  IsLessThan(col: Column<any>, val: any): void;
}

export interface DataApiRequest {
  get(key: string): string;
  getHeader(key: string): string;
  context: any;
  clientIp: string;
}
export interface DataApiServer{
  addAllowedHeader(name:string):void;
  addRequestProcessor(processAndReturnTrueToAouthorise:(req:DataApiRequest)=>boolean):void;

}