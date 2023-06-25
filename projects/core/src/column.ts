import { ClassType } from '../classType';
import { assign } from '../assign';
import { FieldMetadata, FieldOptions, ValueConverter } from './column-interfaces';

import { AndFilter, Filter } from './filter/filter-interfaces';


import { EntityFilter, FindOptions, getEntityRef, idType, Repository, RepositoryImplementation, __updateEntityBasedOnWhere } from './remult3';





export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}





export class CompoundIdField implements FieldMetadata<string> {
  fields: FieldMetadata[];
  constructor(...columns: FieldMetadata[]) {
    this.fields = columns;
  }
  apiUpdateAllowed(item: any): boolean {
    throw new Error('Method not implemented.');
  }
  displayValue(item: any): string {
    throw new Error('Method not implemented.');
  }
  includedInApi: boolean;
  toInput(value: string, inputType?: string): string {
    throw new Error('Method not implemented.');
  }
  fromInput(inputValue: string, inputType?: string): string {
    throw new Error('Method not implemented.');
  }
  getDbName(): Promise<string> {
    return Promise.resolve("");
  }
  getId(instance: any) {
    let r = "";
    this.fields.forEach(c => {
      if (r.length > 0)
        r += ',';
      r += instance[c.key];
    });
    return r;
  }
  options: FieldOptions<any, any>;
  get valueConverter(): Required<ValueConverter<string>> {
    throw new Error("cant get value converter of compound id");
  }

  target: ClassType<any>;
  readonly: true;

  allowNull: boolean;
  dbReadOnly: boolean;
  isServerExpression: boolean;
  key: string;
  caption: string;
  inputType: string;
  dbName: string;

  valueType: any
  isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any> {
    let result = {};
    let val = value.toString();
    let id = val.split(',');
    this.fields.forEach((c, i) => {
      result[c.key] = id[i];
    });
    return result;
  }


  resultIdFilter(id: string, data: any) {
    return new Filter(add => {
      let idParts: any[] = [];
      if (id != undefined)
        idParts = id.split(',');
      this.fields.forEach((c, i) => {
        let val = undefined;
        if (i < idParts.length)
          val = idParts[i];
        if (data[c.key] != undefined)
          val = data[c.key];
        add.isEqualTo(c, val);
      });

    });
  }
}







export class LookupColumn<T> {
  setId(val: any) {
    if (this.repository.metadata.idMetadata.field.valueType == Number)
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
      if (!this._item)
        return null;
      else
        return this._item;
    return this.repository.getCachedById(id);
  }
  set(item: T) {
    this._item = item;
    if (item) {
      if (typeof item === "string" || typeof item === "number") {
        this._id = item as any;
        this._item = undefined;
      } else {
        let eo = getEntityRef(item, false);
        if (eo) {
          this.repository.addToCache(item);
          this._id = eo.getId();
        }
        else {
          this._item = item;
          this._id = item[this.repository.metadata.idMetadata.field.key];
        }
      }
    }
    else if (item === null) {
      this._id = null;
    }
    else {
      this._id = undefined;
    }
  }

  constructor(private repository: RepositoryImplementation<T>, private _id: idType<T>
  ) { }
  private _item = undefined;
  get id() {
    return this._id;
  }
  set id(value: any) {
    this._id = value;
    this._item = undefined;
  }

  get item(): T {
    if (this._item)
      return this._item;
    return this.get(this._id);
  }
  async waitLoad() {
    return this.waitLoadOf(this._id);
  }
}


export class OneToMany<T>{
  constructor(private provider: Repository<T>,
    private settings?: {
      create?: (newItem: T) => void,
    } & FindOptions<T>) {
  }
  private _items: T[];
  private _currentPromise: Promise<T[]>;
  get lazyItems() {
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

  private async find(): Promise<T[]> {
    return this.provider.find(this.settings)
  }
  create(item?: Partial<T>): T {
    let r = this.provider.create();
    __updateEntityBasedOnWhere(this.provider.metadata, this.settings.where, r);
    assign(r, item);

    return r;
  }
}