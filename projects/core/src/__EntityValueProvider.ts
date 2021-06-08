
export interface packedRowInfo {
  data: any,
  isNewRow: boolean,
  id: string,
  wasChanged: boolean

}




export interface RowEvents {
  rowDeleted?: () => void;//deleted
  rowSaved?: (newRow: boolean) => void;//saved
  rowReset?: (newRow: boolean) => void;//consider remove and solve some other way
}
