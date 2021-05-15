
export interface packedRowInfo {
  data: any,
  isNewRow: boolean,
  id: string,
  wasChanged: boolean

}
export interface ColumnValueProvider {
  getValue(key: string, calcDefaultValue: () => void): any;
  getOriginalValue(key: string): any;
  setValue(key: string, value: any): void;
}




export interface RowEvents {
  rowDeleted?: () => void;
  rowSaved?: (newRow: boolean) => void;
  rowReset?: (newRow: boolean) => void;
}
