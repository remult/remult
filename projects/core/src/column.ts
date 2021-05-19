import { Allowed, RoleChecker } from './context';
import { columnDefs, ColumnSettings,  inputLoader, jsonLoader, ValueListItem } from './column-interfaces';
import { DefaultStorage } from './columns/storage/default-storage';
import { AndFilter, Filter } from './filter/filter-interfaces';
import { ColumnValueProvider } from './__EntityValueProvider';

import { EntityWhere, FindOptions, Repository } from './remult3';



export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}





export class CompoundIdColumn 
{
  columns: columnDefs[];
  constructor(...columns: columnDefs[]) {
    // super({
    //   serverExpression: () => this.getId()
    // });
    this.columns = columns;
  }
  __isVirtual() { return true; }
  isEqualTo(value: columnDefs<string> | string): Filter {
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
const typeCache = new Map<any, ValueListTypeInfo<any>>();


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
  async waitLoad() {
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
    this.provider.updateEntityBasedOnWhere(this.settings.where, r);
    if (this.settings.create)
      this.settings.create(r);
    return r;
  }
}