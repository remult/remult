import { Allowed, Context, RoleChecker } from './context';
import { ColumnDefinitions, ColumnSettings, ValueConverter, ValueListItem } from './column-interfaces';

import { AndFilter, Filter } from './filter/filter-interfaces';
import { ColumnValueProvider } from './__EntityValueProvider';

import { ClassType, EntityWhere, FindOptions, Repository } from './remult3';
import { StoreAsStringValueConverter } from './columns/loaders';




export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}





export class CompoundIdColumn {
  columns: ColumnDefinitions[];
  constructor(...columns: ColumnDefinitions[]) {
    // super({
    //   serverExpression: () => this.getId()
    // });
    this.columns = columns;
  }
  __isVirtual() { return true; }
  isEqualTo(value: ColumnDefinitions<string> | string): Filter {
    return new Filter(add => {
      // let val = this.__getVal(value);
      // let id = val.split(',');
      // let result: Filter;
      // this.columns.forEach((c, i) => {
      //   if (!result)
      //     result = c.isEqualTo(id[i]);
      //   else
      //     result = new AndFilter(result, c.isEqualTo(id[i]));
      // });
      // return result.__applyToConsumer(add);
    });
  }
  private getId() {
    let r = "";
    this.columns.forEach(c => {
      // if (r.length > 0)
      //   r += ',';
      // r += c.rawValue;
    });
    return r;
  }
  __addIdToPojo(p: any) {
    if (p.id)
      return;
    let r = "";
    this.columns.forEach(c => {
      // if (r.length > 0)
      //   r += ',';
      // r += p[c.defs.key];
    });
    p.id = r;

  }
  resultIdFilter(id: string, data: any) {
    return new Filter(add => {
      // let idParts: any[] = [];
      // if (id != undefined)
      //   idParts = id.split(',');
      // let result: Filter;
      // this.columns.forEach((c, i) => {
      //   let val = undefined;
      //   if (i < idParts.length)
      //     val = idParts[i];
      //   if (data[c.defs.key] != undefined)
      //     val = data[c.defs.key];
      //   if (!result)
      //     result = c.isEqualTo(val);
      //   else
      //     result = new AndFilter(result, c.isEqualTo(val));
      // });
      // return result.__applyToConsumer(add);
    });
  }
}





export class ValueListValueConverter<T extends ValueListItem> implements ValueConverter<T>{
  private info = ValueListInfo.get(this.type);
  constructor(private type: ClassType<T>) {
    if (this.info.isNumeric) {
      this.columnTypeInDb = 'int';
    }
  }
  fromJson(val: any): T {
    return this.byId(val);
  }
  toJson(val: T) {
    if (!val)
      return undefined;
    return val.id;
  }
  fromDb(val: any): T {
    return this.fromJson(val);
  }
  toDb(val: T) {
    return this.toJson(val);
  }
  toInput(val: T, inputType: string): string {
    return this.toJson(val);
  }
  fromInput(val: string, inputType: string): T {
    return this.fromJson(val);
  }
  displayValue?(val: T): string {
    if (!val)
      return '';
    return val.caption;
  }
  columnTypeInDb?: string;
  inputType?: string;
  getOptions() {
    return this.info.getOptions();
  }
  byId(key: any) {
    if (key === undefined)
      return undefined;
    if (this.info.isNumeric)
      key = +key;

    return this.info.byId(key);
  }
}



class ValueListInfo<T extends ValueListItem> {
  static get<T extends ValueListItem>(type: ClassType<T>): ValueListInfo<T> {
    let r = typeCache.get(type);
    if (!r)
      r = new ValueListInfo(type);
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
        if (typeof s.id === 'number')
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
const typeCache = new Map<any, ValueListInfo<any>>();

export function lookupConverter<T>(type: ClassType<T>) {
  return (c: Context) => {
    return new StoreAsStringValueConverter<LookupColumn<T>>(
      x => x.id.toString(), x => new LookupColumn<T>(c.for(type), x))
  }
}
export class LookupColumn<T> {
  setId(val: any) {
    if (this.repository.defs.idColumn.dataType == Number)
      val = +val;
    this.id = val;
  }
  waitLoadOf(id: any) {
    if (id === undefined || id === null)
      return null;
    return this.repository.getCachedByIdAsync(id);
  }
  get(id: any): any {
    if (id === undefined || id === null)
      return null;
    return this.repository.getCachedById(id);
  }
  set(item: T) {
    if (item) {
      this.repository.addToCache(item);
      this.id = item["id"];
    }
    else {
      this.id = undefined;
    }
  }

  constructor(private repository: Repository<T>, public id: string
  ) { }
  exists() {
    return !this.repository.getRowHelper(this.item).isNew();
  }
  get item(): T {

    return this.get(this.id);
  }
  async waitLoad() {
    return this.waitLoadOf(this.id);
  }
}


export class ManyToOne<T>{
  constructor(private repository: Repository<T>,
    private where: EntityWhere<T>
  ) { }
  exists() {
    return !this.repository.getRowHelper(this.item).isNew();
  }
  get item(): T {
    return this.repository.lookup(this.where);
  }
  async load() {
    return this.repository.lookupAsync(this.where);
  }
}

export class OneToMany<T>{
  constructor(private provider: Repository<T>,
    private settings?: {
      create?: (newItem: T) => void,
    } & FindOptions<T>) {
    if (!this.settings)
      this.settings = {};
  }
  private _items: T[];
  private _currentPromise: Promise<T[]>;
  get items() {
    this.load();
    return this._items;
  }
  async load() {
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
    return this.load();
  }
  private async find(): Promise<T[]> {
    return this.provider.find(this.settings)
  }
  create(): T {
    let r = this.provider.create();
    this.provider.updateEntityBasedOnWhere(this.settings.where, r);
    if (this.settings.create)
      this.settings.create(r);
    return r;
  }
}