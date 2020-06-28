import { Column } from "../column";
import { ColumnOptions, ValueListItem } from "../column-interfaces";


export class ValueListColumn<T extends ValueListItem> extends Column<T> {
  constructor(private closedListType: any, settingsOrCaption?: ColumnOptions<T>) {
    super({
      dataControlSettings: () => {
        let opts = this.getOptions();
        console.log(opts);
        return {
          valueList: opts
        }
      }
    }, settingsOrCaption);
    for (let member in this.closedListType) {
      let s = this.closedListType[member] as T;
      if (s instanceof this.closedListType) {
        if (s.id === undefined)
          s.id = member;
        if (s.caption === undefined)
          s.caption = member;

      }

    }
  }
  getOptions(): ValueListItem[] {
    let result = [];
    for (let member in this.closedListType) {
      let s = this.closedListType[member] as T;
      if (s instanceof this.closedListType) {

        result.push(s)
      }
    }
    return result;
  }
  toRawValue(value: T) {
    return value.id;
  }
  fromRawValue(value: any) {
    return this.byId(value);
  }

  get displayValue() {
    if (this.value)
      return this.value.caption;
    return '';
  }
  byId(id: number): T {
    for (let member in this.closedListType) {
      let s = this.closedListType[member] as T;
      if (s instanceof this.closedListType) {
        if (s.id == id)
          return s;
      }
    }
    return undefined;
  }
}