import { Column } from "../column";
import { ColumnOptions, ValueListItem } from "../column-interfaces";


  export class ValueListColumn<T extends ValueListItem> extends Column<T> {
    constructor(private closedListType: any, settingsOrCaption?: ColumnOptions<T>,settingsOrCaption1?: ColumnOptions<T>) {
      super(settingsOrCaption,settingsOrCaption1);
    }
    getOptions(): ValueListItem[] {
      let result = [];
      for (let member in this.closedListType) {
        let s = this.closedListType[member] as T;
        if (s && s.id != undefined) {
          result.push(s)
        }
      }
      return result;
    }
    toRawValue(value: T) {
      return value.id;
    }
    fromRawValue(value: any) {
      return this.byId(+value);
    }
  
    get displayValue() {
      if (this.value)
        return this.value.caption;
      return '';
    }
    byId(id: number): T {
      for (let member in this.closedListType) {
        let s = this.closedListType[member] as T;
        if (s && s.id == id)
          return s;
      }
      return undefined;
    }
  }