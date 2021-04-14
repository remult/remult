import { Column, makeTitle } from "../column";
import { ColumnSettings, ValueListItem } from "../column-interfaces";
import { isNumber } from 'util';
import { Entity } from "../entity";
import { StringColumn } from "./string-column";
import { SpecificEntityHelper } from "../context";
import { FindOptions, updateEntityBasedOnWhere } from "../data-interfaces";


export class ValueListColumn<T extends ValueListItem> extends Column<T> {

  constructor(private valueListType: classWithNew<T>, settings?: ColumnSettings<T>) {
    super({ displayValue: () => this.value.caption, ...settings });


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



}
export declare type classWithNew<T> = { new(...args: any[]): T; };

export class ValueListTypeInfo<T extends ValueListItem>{
  static get<T extends ValueListItem>(type: classWithNew<T>): ValueListTypeInfo<T> {
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
          s.caption = makeTitle(member);
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

export class LookupColumn<T extends Entity<string>> extends StringColumn {
  constructor(private provider: SpecificEntityHelper<string, T>, settings?: ColumnSettings<string>) {
    super(settings);
  }

  get lookup(): T {
    return this.provider.lookup(this);
  }
  async waitLoad() {
    return this.provider.lookupAsync(this);
  }

}
export class OneToMany<T extends Entity>{
  constructor(private provider: SpecificEntityHelper<string, T>,
    private settings?: {
      create?: (newItem: T) => void,
    } & FindOptions<T>) {
    if (!this.settings)
      this.settings = {};
  }
  private _items: T[];
  private _currentPromise: Promise<T[]>;
  get items() {
    this.waitLoad();
    return this._items;
  }
  async waitLoad() {
    if (this._currentPromise != null)
      return this._currentPromise;
    if (this._items === undefined)
      this._items = [];
    return this._currentPromise = this.find().then(x => {
      this._items.splice(0);
      this._items.push(...x);
      return this._items;
    });
  }
  async reload() {
    this._currentPromise = undefined;
    return this.waitLoad();
  }
  private async find(): Promise<T[]> {
    return this.provider.find(this.settings)
  }
  create(): T {
    let r = this.provider.create();
    updateEntityBasedOnWhere(this.settings.where, r);
    if (this.settings.create)
      this.settings.create(r);
    return r;
  }
}