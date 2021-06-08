import { Allowed, Context, RoleChecker } from './context';
import { FieldDefinitions, FieldSettings, ValueConverter, ValueListItem } from './column-interfaces';

import { AndFilter, Filter } from './filter/filter-interfaces';


import { ClassType, EntityWhere, FindOptions, Repository, __updateEntityBasedOnWhere } from './remult3';





export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}





export class CompoundIdField implements FieldDefinitions<string> {
  fields: FieldDefinitions[];
  constructor(...columns: FieldDefinitions[]) {
    // super({
    //   serverExpression: () => this.getId()
    // });
    this.fields = columns;
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
  evilOriginalSettings: FieldSettings<any, any>;
  get valueConverter(): ValueConverter<string> {
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

  dataType: any
  __isVirtual() { return true; }
  isEqualTo(value: FieldDefinitions<string> | string): Filter {
    return new Filter(add => {
      let val = value.toString();
      let id = val.split(',');
      this.fields.forEach((c, i) => {
        add.isEqualTo(c, id[i]);
      });
    });
  }

  __addIdToPojo(p: any) {
    if (p.id)
      return;
    let r = "";
    this.fields.forEach(c => {
      // if (r.length > 0)
      //   r += ',';
      // r += p[c.defs.key];
    });
    p.id = r;

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
    if (this.repository.defs.idField.dataType == Number)
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
    __updateEntityBasedOnWhere(this.provider.defs, this.settings.where, r);
    if (this.settings.create)
      this.settings.create(r);
    return r;
  }
}