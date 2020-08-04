import { Column } from "../column";
import { ColumnOptions, ValueListItem } from "../column-interfaces";
import { isNumber } from 'util';


export class ValueListColumn<T extends ValueListItem> extends Column<T> {

  constructor(private valueListType:  classWithNew<T>, settingsOrCaption?: ColumnOptions<T>) {
    super({
      dataControlSettings: () => {
        let opts = this.getOptions();
        return {
          valueList: opts
        }
      }

    }, settingsOrCaption);


  }
  readonly info = ValueListTypeInfo.get(this.valueListType);

  getOptions(): ValueListItem[] {
    return this.info.getOptions();
  }
  toRawValue(value: T) {
    return value.id;
  }
  fromRawValue(value: any) {
    return this.info.byId(value);
  }

  get displayValue() {
    if (this.value)
      return this.value.caption;
    return '';
  }

}
export declare type classWithNew<T > ={ new(...args: any[]): T; };

export class ValueListTypeInfo<T extends ValueListItem>{
  static get<T extends ValueListItem>(type: classWithNew<T>):ValueListTypeInfo<T> {
    let r = typeCache.get(type);
    if (!r)
      r = new ValueListTypeInfo(type);
    typeCache.set(type, r);
    return r;
  }
  private byIdMap = new Map<any, T>();
  private values: T[] = [];
  isNumeric = false;
  private constructor(private valueListType: any) {
    for (let member in this.valueListType) {
      let s = this.valueListType[member] as T;
      if (s instanceof this.valueListType) {
        if (s.id === undefined)
          s.id = member;
        if (s.caption === undefined)
          s.caption = member;
        if (isNumber(s.id))
          this.isNumeric = true;
        this.byIdMap.set(s.id, s);
        this.values.push(s);
      }
    }
  }
  getOptions() {
    return this.values;
  }
  byId(key: any) {
    if (this.isNumeric)
      key = +key;
    return this.byIdMap.get(key);
  }
}
const typeCache = new Map<any, ValueListTypeInfo<any>>();