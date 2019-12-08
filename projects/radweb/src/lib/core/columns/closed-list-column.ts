import { Column } from "../column";
import { ColumnOptions, DropDownItem } from "../dataInterfaces1";

export interface ClosedListItem {
    id: number;
    toString(): string;
  }
  export class ClosedListColumn<closedListType extends ClosedListItem> extends Column<closedListType> {
    constructor(private closedListType: any, settingsOrCaption?: ColumnOptions<closedListType>,settingsOrCaption1?: ColumnOptions<closedListType>) {
      super(settingsOrCaption,settingsOrCaption1);
    }
    getOptions(): DropDownItem[] {
      let result = [];
      for (let member in this.closedListType) {
        let s = this.closedListType[member] as closedListType;
        if (s && s.id != undefined) {
          result.push({
            id: s.id,
            caption: s.toString()
          })
        }
      }
      return result;
    }
    toRawValue(value: closedListType) {
      return value.id;
    }
    fromRawValue(value: any) {
      return this.byId(+value);
    }
  
    get displayValue() {
      if (this.value)
        return this.value.toString();
      return '';
    }
    byId(id: number): closedListType {
      for (let member in this.closedListType) {
        let s = this.closedListType[member] as closedListType;
        if (s && s.id == id)
          return s;
      }
      return undefined;
    }
  }